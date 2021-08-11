local UserMT = {}
User = {}

local KILOBYTE = 1024
local MEGABYTE = KILOBYTE * 1024
local GIGABYTE = MEGABYTE * 1024

local STORAGE_BASE = 1 * GIGABYTE

local function makeusermt(user)
    user.not_in_db = nil
    setmetatable(user, UserMT)
    user:ComputeVirtuals()
    return user
end

function User.GetByID(id)
	local user = get_ctx_database():query_safe('SELECT * FROM users WHERE id = %s', id)
	user = user[1]

	if not user then
		return nil
	end

	return makeusermt(user)
end

function User.GetByUsername(username)
	local user = get_ctx_database():query_safe('SELECT * FROM users WHERE lower(username) = %s', username:lower())
	user = user[1]

	if not user then
		return nil
	end

	return makeusermt(user)
end

function User.New()
    local user = {
        not_in_db = true,
        id = uuid.generate_random()(10),
        time = ngx.time(),
    }
    setmetatable(user, UserMT)
    return user
end

function User.CalculateUsedBytes(user)
    if user.id then
        user = user.id
    end
    local res = get_ctx_database():query_safe('SELECT SUM(size) AS usedbytes FROM files WHERE "user" = %s', user)
	return res[1].usedbytes or 0
end

function UserMT:SetEMail(email)
	if not ngx.re.match(email, "^[a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\\.[a-zA-Z]{2,}$", "o") then
		return VALIDATION_STATE_INVALID
	end

	local res = get_ctx_database():query_safe('SELECT id FROM users WHERE lower(email) = %s', email:lower())
	if res[1] then
		return VALIDATION_STATE_TAKEN
	end

    local oldemail = self.email
    self.email = email
    if (not oldemail) or email:lower() ~= oldemail:lower() then
        self.active = 0
        self.require_email_confirmation = true
    end

    return VALIDATION_STATE_OK
end

function UserMT:SetUsername(username)
	if not ngx.re.match(username, "^[a-zA-Z0-9 .,;_-]+$", "o") then
		return VALIDATION_STATE_INVALID
	end

	local res = get_ctx_database():query_safe('SELECT id FROM users WHERE lower(username) = %s', username:lower())
	if res[1] then
		return VALIDATION_STATE_TAKEN
	end

    self.username = username

    return VALIDATION_STATE_OK
end

function UserMT:SetPassword(password)
    self.password = argon2.hash(password, randstr(32))
end

function UserMT:CheckPassword(password)
	local authOk = false
	local authNeedsUpdate = false
	if self.password:sub(1, 13) == "$fcvhmacsha1$" then
		local pw = self.password:sub(14)
		local saltIdx = pw:find("$", 1, true)
		local salt = pw:sub(1, saltIdx - 1)
		pw = pw:sub(saltIdx + 1)

		pw = ngx.decode_base64(pw)
		salt = ngx.decode_base64(salt)

		authOk = ngx.hmac_sha1(salt, password) == pw
		authNeedsUpdate = true
	else
		authOk = argon2.verify(self.password, password)
	end
	if authOk and authNeedsUpdate then
        self:SetPassword(password)
        self:Save()
	end
	return authOk
end

function UserMT:CalculateUsedBytes()
    return User.CalculateUsedBytes(self)
end

function UserMT:GetPrivate()
    self.password = nil
    self.loginkey = nil
    self.usedbytes = self:CalculateUsedBytes()
    return self
end

function UserMT:GetPublic()
    return {
        id = self.id,
        username = self.username,
    }
end

function UserMT:ComputeVirtuals()
	self.totalbytes = STORAGE_BASE + self.bonusbytes
end

function UserMT:Save()
    if self.not_in_db then
        get_ctx_database():query_safe('INSERT INTO users (id, username, email, password, loginkey, apikey, active, bonusbytes) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)', self.id, self.username, self.email, self.password, self.loginkey, self.apikey, self.active, self.bonusbytes)
        self.not_in_db = nil
    else
        get_ctx_database():query_safe('UPDATE users SET username = %s, email = %s, password = %s, loginkey = %s, apikey = %s, active = %s, bonusbytes = %s WHERE id = %s', self.username, self.email, self.password, self.loginkey, self.apikey, self.active, self.bonusbytes, self.id)
    end

    if self.require_email_confirmation then
        local emailid = randstr(32)

        local email_text = "Hello, " .. self.username .. "!\n\nYou have recently registered or changed your E-Mail on foxCaves.\nPlease click the following link to activate your E-Mail:\n"
        email_text = email_text .. MAIN_URL .. "/email/code?code=" .. emailid .. "\n\n"
        email_text = email_text .. "Kind regards,\nfoxCaves Support"
    
        local emailkey = "emailkeys:" .. emailid
        redis:hmset(emailkey, "user", self.id, "action", "activation")
        redis:expire(emailkey, 172800) --48 hours
    
        mail(self.email, "foxCaves - Activation E-Mail", email_text, "noreply@foxcav.es", "foxCaves")

        self.require_email_confirmation = nil
    end

    if self.kick_user then
        raw_push_action({
            action = "kick",
        }, self)

        self.kick_user = nil
    end
end

function UserMT:MakeNewLoginKey()
    self.loginkey = randstr(64)
    self.kick_user = true
    if ngx.ctx.user and self.id == ngx.ctx.user.id then
        ngx.ctx.user = self
        send_login_key()
    end
end

function UserMT:MakeNewAPIKey()
    self.apikey = randstr(64)
end

UserMT.__index = UserMT
