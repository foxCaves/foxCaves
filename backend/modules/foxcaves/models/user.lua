local uuid = require('resty.jit-uuid')
local argon2 = require('argon2')
local database = require('foxcaves.database')
local redis = require('foxcaves.redis')
local config = require('foxcaves.config')
local events = require('foxcaves.events')
local mail = require('foxcaves.mail')
local random = require('foxcaves.random')
local consts = require('foxcaves.consts')
local totp = require('foxcaves.totp')

local setmetatable = setmetatable
local ngx = ngx
local next = next
local tonumber = tonumber

local user_mt = {}
local user_model = {}

require('foxcaves.module_helper').setmodenv()

local KILOBYTE = 1024
local MEGABYTE = KILOBYTE * 1024
local GIGABYTE = MEGABYTE * 1024

local STORAGE_BASE = 1 * GIGABYTE

local function makeusermt(user)
    database.transfer_time_columns(user, user)
    user.not_in_db = nil
    local fields = user_model.get_private_fields()
    for field, field_cfg in next, fields do
        if field_cfg.type == 'integer' then
            user[field] = tonumber(user[field])
        end
    end
    setmetatable(user, user_mt)
    return user
end

local user_select =
    'id, username, email, password, totp_secret, security_version, api_key, email_valid, approved, storage_quota, admin, ' .. database.TIME_COLUMNS

function user_model.get_by_query(query, options, ...)
    local users = database.get_shared():query('SELECT ' .. user_select .. ' FROM users WHERE ' .. query, options, ...)
    for k, v in next, users do
        users[k] = makeusermt(v)
    end
    return users
end

function user_model.count_by_query(query, ...)
    local res = database.get_shared():query_single('SELECT COUNT(id) AS count FROM users WHERE ' .. query, nil, ...)
    if not res then
        return 0
    end
    return res.count
end

function user_model.get_by_id(id)
    if not id or not uuid.is_valid(id) then
        return nil
    end

    id = id:lower()

    if ngx.ctx.user and ngx.ctx.user.id == id then
        return ngx.ctx.user
    end

    local users = user_model.get_by_query('id = %s', nil, id)
    return users[1]
end

function user_model.get_by_username(username, always_query)
    if not username then
        return nil
    end

    username = username:lower()

    if not always_query and ngx.ctx.user and ngx.ctx.user.username:lower() == username then
        return ngx.ctx.user
    end

    local users = user_model.get_by_query('lower(username) = %s', nil, username)
    return users[1]
end

function user_model.get_by_email(email, always_query)
    if not email then
        return nil
    end

    email = email:lower()

    if not always_query and ngx.ctx.user and ngx.ctx.user.email:lower() == email then
        return ngx.ctx.user
    end

    local users = user_model.get_by_query('lower(email) = %s', nil, email)
    return users[1]
end

function user_model.new()
    local user = {
        not_in_db = true,
        id = uuid.generate_v4(),
        security_version = 1,
        storage_quota = STORAGE_BASE,
        active = 0,
        approved = 0,
        admin = 0,
        totp_secret = '',
    }

    setmetatable(user, user_mt)
    user:make_new_api_key()
    return user
end

function user_mt:set_email(email)
    if not ngx.re.match(email, '^[a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\\.[a-zA-Z]{2,}$', 'o') then
        return consts.VALIDATION_STATE_INVALID
    end

    if not self.email or email:lower() ~= self.email:lower() then
        local res = user_model.get_by_email(email, true)
        if res then
            return consts.VALIDATION_STATE_TAKEN
        end
        self.email_valid = 0
        self.require_email_confirmation = true
    end

    self.email = email

    return consts.VALIDATION_STATE_OK
end

function user_mt:set_username(username)
    if not ngx.re.match(username, '^[a-zA-Z0-9 .,;_-]+$', 'o') then
        return consts.VALIDATION_STATE_INVALID
    end

    local res = user_model.get_by_username(username, true)
    if res then
        return consts.VALIDATION_STATE_TAKEN
    end

    self.username = username

    return consts.VALIDATION_STATE_OK
end

function user_mt:set_password(password)
    self.password = argon2.hash_encoded(password, random.bytes(32))
end

function user_mt:check_password(password)
    local auth_ok
    local auth_needs_update = false
    if self.password:sub(1, 13) == '$fcvhmacsha1$' then
        local pw = self.password:sub(14)
        local saltIdx = pw:find('$', 1, true)
        local salt = pw:sub(1, saltIdx - 1)
        pw = pw:sub(saltIdx + 1)

        pw = ngx.decode_base64(pw)
        salt = ngx.decode_base64(salt)

        auth_ok = ngx.hmac_sha1(salt, password) == pw
        auth_needs_update = true
    else
        auth_ok = argon2.verify(self.password, password)
    end
    if auth_ok and auth_needs_update then
        self:set_password(password)
        self:save()
    end
    return auth_ok
end

function user_mt:check_totp(code)
    if not self.totp_secret or self.totp_secret == '' then
        return true
    end
    return totp.check(self.totp_secret, code)
end

function user_mt:calculate_storage_used()
    local res =
        database.get_shared():query_single(
            'SELECT SUM(size) AS storage_used FROM files WHERE uploaded = 1 AND owner = %s',
            nil,
            self.id
        )
    return res and tonumber(res.storage_used) or 0
end

function user_mt:has_free_storage_for(size)
    if self.storage_quota < 0 then
        return true
    end
    return self.storage_quota >= (self:calculate_storage_used() + size)
end

function user_mt:send_event_raw(data)
    events.push_raw('user:' .. self.id, data)
end

function user_mt:send_event(action, model, data)
    events.push('user:' .. self.id, action, model, data)
end

function user_mt:send_self_event(action)
    action = action or 'update'
    self:send_event(action, 'user', self:get_private())
end

function user_mt:is_admin()
    return self.admin == 1
end

function user_mt:save()
    if config.app.disable_email_confirmation then
        self.require_email_confirmation = nil
        self.email_valid = 1
    end

    if not config.app.require_user_approval then
        self.approved = 1
    end

    local primary_push_action
    local res =
        database.get_shared():query_single(
            'INSERT INTO users \
            (id, username, email, password, totp_secret, security_version, api_key, email_valid, approved, storage_quota) VALUES \
            (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s) \
            ON DUPLICATE KEY UPDATE \
            username = VALUES(username), \
            email = VALUES(email), \
            password = VALUES(password), \
            totp_secret = VALUES(totp_secret), \
            security_version = VALUES(security_version), \
            api_key = VALUES(api_key), \
            email_valid = VALUES(email_valid), \
            approved = VALUES(approved), \
            storage_quota = VALUES(storage_quota) \
            RETURNING ' .. database.TIME_COLUMNS,
            nil,
            self.id,
            self.username,
            self.email,
            self.password,
            self.totp_secret,
            self.security_version,
            self.api_key,
            self.email_valid,
            self.approved,
            self.storage_quota
        )

    if self.not_in_db then
        primary_push_action = 'create'
        self.not_in_db = nil
    else
        primary_push_action = 'update'
    end

    database.transfer_time_columns(self, res)

    if self.require_email_confirmation then
        local emailid = random.string(32)

        local email_text =
            'You have recently registered or changed your E-Mail on foxCaves.' .. '\nPlease click the following link to activate your E-Mail:\n' .. config.http.app_url .. '/email/code/' .. emailid

        local redis_inst = redis.get_shared()
        local emailkey = 'emailkeys:' .. emailid
        redis_inst:hmset(emailkey, 'user', self.id, 'action', 'activation')
        redis_inst:expire(emailkey, 172800) -- 48 hours
        mail.send(self, 'Activation E-Mail', email_text)

        self.require_email_confirmation = nil
    end

    if self.kick_user then
        self:send_event_raw({ type = 'kick' })

        self.kick_user = nil
    end

    self:send_self_event(primary_push_action)
end

function user_mt:make_new_security_version()
    self.security_version = self.security_version + 1
    self.kick_user = true
    if ngx.ctx.user and self.id == ngx.ctx.user.id then
        ngx.ctx.user = self
    end
end

function user_mt:make_new_api_key()
    self.api_key = random.string(64)
end

function user_mt:delete()
    database.get_shared():query('DELETE FROM users WHERE id = %s', nil, self.id)
    self:send_self_event('delete')
end

function user_mt:can_perform_write()
    return self:is_active()
end

function user_mt:is_active()
    return self.email_valid > 0 and self.approved > 0
end

function user_mt:get_private()
    return {
        id = self.id,
        username = self.username,
        email = self.email,
        api_key = self.api_key,
        active = self:is_active() and 1 or 0,
        email_valid = self.email_valid,
        approved = self.approved,
        storage_used = self:calculate_storage_used(),
        storage_quota = self.storage_quota,
        totp_enabled = self.totp_secret and self.totp_secret ~= '' and 1 or 0,
        created_at = self.created_at,
        updated_at = self.updated_at,
    }
end

function user_mt.can_view(_, _)
    return true
end

function user_mt:can_view_subresources(user)
    return self:can_edit(user)
end

function user_mt:can_edit(user)
    if not user then
        return false
    end
    if user.id == self.id then
        return true
    end
    if user:is_admin() then
        return true
    end
    return false
end

function user_model.get_private_fields()
    return {
        id = {
            type = 'uuid',
            required = true,
        },
        username = {
            type = 'string',
            required = true,
        },
        email = {
            type = 'string',
            required = true,
        },
        api_key = {
            type = 'string',
            required = true,
        },
        active = {
            type = 'integer',
            required = true,
        },
        approved = {
            type = 'integer',
            required = true,
        },
        email_valid = {
            type = 'integer',
            required = true,
        },
        storage_used = {
            type = 'integer',
            required = true,
        },
        storage_quota = {
            type = 'integer',
            required = true,
        },
        created_at = {
            type = 'timestamp',
            required = true,
        },
        updated_at = {
            type = 'timestamp',
            required = true,
        },
    }
end

function user_mt:get_public()
    return {
        id = self.id,
        username = self.username,
        created_at = self.created_at,
        updated_at = self.updated_at,
    }
end

function user_model.get_public_fields()
    return {
        id = {
            type = 'uuid',
            required = true,
        },
        username = {
            type = 'string',
            required = true,
        },
        created_at = {
            type = 'timestamp',
            required = true,
        },
        updated_at = {
            type = 'timestamp',
            required = true,
        },
    }
end

user_mt.__index = user_mt

return user_model
