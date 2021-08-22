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
    user:compute_virtuals()
    return user
end

local user_select = 'id, username, email, password, loginkey, apikey, active, bonusbytes, ' .. database.TIME_COLUMNS

function user_model.get_by_id(id)
    if not uuid.is_valid(id) then
        return nil
    end

	local user = database.get_shared():query_safe_single('SELECT ' .. user_select .. ' FROM users WHERE id = %s', id)

	if not user then
		return nil
	end

	return makeusermt(user)
end

function user_model.get_by_username(username)
	local user = database.get_shared():query_safe_single(
        'SELECT ' .. user_select .. ' FROM users WHERE lower(username) = %s',
        username:lower()
    )

	if not user then
		return nil
	end

	return makeusermt(user)
end

function user_model.new()
    local user = {
        not_in_db = true,
        id = uuid.generate_random()(10),
    }
    setmetatable(user, user_mt)
    return user
end

function user_model.calculate_used_bytes(user)
    if user.id then
        user = user.id
    end
    local res = database.get_shared():query_safe('SELECT SUM(size) AS usedbytes FROM files WHERE "user" = %s', user)
	return res[1].usedbytes or 0
end

function user_mt:set_email(email)
	if not ngx.re.match(email, "^[a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\\.[a-zA-Z]{2,}$", "o") then
		return consts.VALIDATION_STATE_INVALID
	end

    if (not self.email) or email:lower() ~= self.email:lower() then
        local res = database.get_shared():query_safe('SELECT id FROM users WHERE lower(email) = %s', email:lower())
        if res[1] then
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

	local res = database.get_shared():query_safe('SELECT id FROM users WHERE lower(username) = %s', username:lower())
	if res[1] then
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

function user_mt:calculate_used_bytes()
    return user_model.calculate_used_bytes(self)
end

function user_mt:get_private()
    self.password = nil
    self.loginkey = nil
    self.usedbytes = self:calculate_used_bytes()
    return self
end

function user_mt:get_public()
    return {
        id = self.id,
        username = self.username,
    }
end

function user_mt:compute_virtuals()
	self.totalbytes = STORAGE_BASE + self.bonusbytes
end

function user_mt:save()
    local res
    if self.not_in_db then
        res = database.get_shared():query_safe_single(
            'INSERT INTO users \
                (id, username, email, password, loginkey, apikey, active, bonusbytes) VALUES\
                (%s, %s, %s, %s, %s, %s, %s, %s) \
                RETURNING ' .. database.TIME_COLUMNS,
            self.id, self.username, self.email, self.password, self.loginkey, self.apikey, self.active, self.bonusbytes
        )
        self.not_in_db = nil
    else
        res = database.get_shared():query_safe_single(
            'UPDATE users \
                SET username = %s, email = %s, password = %s, loginkey = %s, apikey = %s, active = %s, bonusbytes = %s, \
                    updated_at = (now() at time zone \'utc\') \
                WHERE id = %s \
                RETURNING ' .. database.TIME_COLUMNS,
            self.username, self.email, self.password, self.loginkey, self.apikey, self.active, self.bonusbytes, self.id
        )
    end
    self.created_at = res.created_at
    self.updated_at = res.updated_at

    if self.require_email_confirmation then
        local emailid = random.string(32)

        local email_text = "Hello, " .. self.username .. "!" ..
            "\n\nYou have recently registered or changed your E-Mail on foxCaves." ..
            "\nPlease click the following link to activate your E-Mail:\n"
        email_text = email_text .. main_url .. "/email/code?code=" .. emailid .. "\n\n"
        email_text = email_text .. "Kind regards,\nfoxCaves Support"

        local redis_inst = redis.get_shared()
        local emailkey = "emailkeys:" .. emailid
        redis_inst:hmset(emailkey, "user", self.id, "action", "activation")
        redis_inst:expire(emailkey, 172800) --48 hours

        mail.send(self.email, "foxCaves - Activation E-Mail", email_text, "noreply@foxcav.es", "foxCaves")

        self.require_email_confirmation = nil
    end

    if self.kick_user then
        events.push_raw({
            action = "kick",
        }, self)

        self.kick_user = nil
    end
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

user_mt.__index = user_mt

return user_model
