local uuid = require("resty.uuid")
local argon2 = require("argon2")
local database = require("foxcaves.database")
local redis = require("foxcaves.redis")
local events = require("foxcaves.events")
local mail = require("foxcaves.mail")
local random = require("foxcaves.random")
local consts = require("foxcaves.consts")
local auth_utils = require("foxcaves.auth_utils")
local main_url = require("foxcaves.config").urls.main

local setmetatable = setmetatable
local ngx = ngx

local user_mt = {}
local user_model = {}

require("foxcaves.module_helper").setmodenv()

local KILOBYTE = 1024
local MEGABYTE = KILOBYTE * 1024
local GIGABYTE = MEGABYTE * 1024

local STORAGE_BASE = 1 * GIGABYTE

local function makeusermt(user)
    user.not_in_db = nil
    setmetatable(user, user_mt)
    return user
end

local user_select = 'id, username, email, password, loginkey, apikey, active, storage_quota, ' .. database.TIME_COLUMNS

function user_model.get_by_id(id)
    if (not id) or (not uuid.is_valid(id)) then
        return nil
    end

    id = id:lower()

    if ngx.ctx.user and ngx.ctx.user.id == id then
        return ngx.ctx.user
    end

    local user = database.get_shared():query_single('SELECT ' .. user_select .. ' FROM users WHERE id = %s', id)

    if not user then
        return nil
    end

    return makeusermt(user)
end

function user_model.get_by_username(username)
    if not username then
        return nil
    end

    username = username:lower()

    if ngx.ctx.user and ngx.ctx.user.username:lower() == username then
        return ngx.ctx.user
    end

    local user = database.get_shared():query_single(
        'SELECT ' .. user_select .. ' FROM users WHERE lower(username) = %s',
        username
    )

    if not user then
        return nil
    end

    return makeusermt(user)
end

function user_model.new()
    local user = {
        not_in_db = true,
        id = uuid.generate_random(),
        storage_quota = STORAGE_BASE,
        active = 0,
    }
    setmetatable(user, user_mt)
    return user
end

function user_mt:set_email(email)
    if not ngx.re.match(email, "^[a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\\.[a-zA-Z]{2,}$", "o") then
        return consts.VALIDATION_STATE_INVALID
    end

    if (not self.email) or email:lower() ~= self.email:lower() then
        local res = database.get_shared():query_single('SELECT id FROM users WHERE lower(email) = %s', email:lower())
        if res then
            return consts.VALIDATION_STATE_TAKEN
        end
        self.active = 0
        self.require_email_confirmation = true
    end
    self.email = email

    return consts.VALIDATION_STATE_OK
end

function user_mt:set_username(username)
    if not ngx.re.match(username, "^[a-zA-Z0-9 .,;_-]+$", "o") then
        return consts.VALIDATION_STATE_INVALID
    end

    local res = database.get_shared():query_single('SELECT id FROM users WHERE lower(username) = %s', username:lower())
    if res then
        return consts.VALIDATION_STATE_TAKEN
    end

    self.username = username

    return consts.VALIDATION_STATE_OK
end

function user_mt:set_password(password)
    self.password = argon2.hash_encoded(password, random.chars(32))
end

function user_mt:check_password(password)
    local auth_ok
    local auth_needs_update = false
    if self.password:sub(1, 13) == "$fcvhmacsha1$" then
        local pw = self.password:sub(14)
        local saltIdx = pw:find("$", 1, true)
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

function user_mt:calculate_storage_used()
    local db = database.get_shared()
    local res = db:query_single('SELECT SUM(size) AS storage_used FROM files WHERE "user" = %s', self.id)
    return res and res.storage_used or 0
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
    self:send_event_raw({
        type = 'liveloading',
        action = action,
        model = model,
        data = data,
    })
end

function user_mt:send_self_event(action)
    action = action or 'update'
    self:send_event(action, 'user', self:get_private())
end

function user_mt:get_private()
    return {
        id = self.id,
        username = self.username,
        email = self.email,
        apikey = self.apikey,
        active = self.active,
        storage_used = self:calculate_storage_used(),
        storage_quota = self.storage_quota,
        created_at = self.created_at,
        updated_at = self.updated_at,
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

function user_mt:save()
    local res, primary_push_action
    if self.not_in_db then
        res = database.get_shared():query_single(
            'INSERT INTO users \
                (id, username, email, password, loginkey, apikey, active, storage_quota) VALUES \
                (%s, %s, %s, %s, %s, %s, %s, %s) \
                RETURNING ' .. database.TIME_COLUMNS,
            self.id, self.username, self.email, self.password, self.loginkey, self.apikey, self.active,
            self.storage_quota
        )
        primary_push_action = 'create'
        self.not_in_db = nil
    else
        res = database.get_shared():query_single(
            'UPDATE users \
                SET username = %s, email = %s, password = %s, loginkey = %s, apikey = %s, active = %s, storage_quota = %s, \
                    updated_at = (now() at time zone \'utc\') \
                WHERE id = %s \
                RETURNING ' .. database.TIME_COLUMNS,
            self.username, self.email, self.password, self.loginkey, self.apikey, self.active, self.storage_quota,
            self.id
        )
        primary_push_action = 'update'
    end
    self.created_at = res.created_at
    self.updated_at = res.updated_at

    if self.require_email_confirmation then
        local emailid = random.string(32)

        local email_text ="You have recently registered or changed your E-Mail on foxCaves." ..
                          "\nPlease click the following link to activate your E-Mail:\n" ..
                          main_url .. "/email/code?code=" .. emailid

        local redis_inst = redis.get_shared()
        local emailkey = "emailkeys:" .. emailid
        redis_inst:hmset(emailkey, "user", self.id, "action", "activation")
        redis_inst:expire(emailkey, 172800) --48 hours

        mail.send(self, "Activation E-Mail", email_text)

        self.require_email_confirmation = nil
    end

    if self.kick_user then
        self:send_event_raw({
            type = "kick",
        })

        self.kick_user = nil
    end

    self:send_self_event(primary_push_action)
end

function user_mt:make_new_login_key()
    self.loginkey = random.string(64)
    self.kick_user = true
    if ngx.ctx.user and self.id == ngx.ctx.user.id then
        ngx.ctx.user = self
        auth_utils.send_login_key()
    end
end

function user_mt:make_new_api_key()
    self.apikey = random.string(64)
end

function user_mt:delete()
    database.get_shared():query('DELETE FROM users WHERE id = %s', self.id)
    self:send_self_event('delete')
end

function user_mt:can_perform_write()
    return self.active == 1
end

user_mt.__index = user_mt

return user_model
