local utils = require("foxcaves.utils")
local auth_utils = require("foxcaves.auth_utils")
local redis = require("foxcaves.redis")
local random = require("foxcaves.random")
local consts = require("foxcaves.consts")
local User = require("foxcaves.models.user")

local ngx = ngx

local M = {}
require("foxcaves.module_helper").setmodenv()

local SESSION_EXPIRE_DELAY = 7200

function M.LOGIN_METHOD_PASSWORD(userdata, password)
	return userdata:CheckPassword(password)
end
function M.LOGIN_METHOD_APIKEY(userdata, apikey)
	return userdata.apikey == apikey
end
function M.LOGIN_METHOD_LOGINKEY(userdata, loginkey)
	return auth_utils.hash_login_key(userdata.loginkey) == ngx.decode_base64(loginkey)
end

function M.login(username_or_id, credential, options)
	options = options or {}
	local nosession = options.nosession
	local login_with_id = options.login_with_id

	if utils.is_falsy_or_null(username_or_id) or utils.is_falsy_or_null(credential) then
		return consts.LOGIN_BAD_CREDENTIALS
	end

	local user
	if login_with_id then
		user = User.GetByID(username_or_id)
	else
		user = User.GetByUsername(username_or_id)
	end

	if not user then
		return consts.LOGIN_BAD_CREDENTIALS
	end

	local auth_func = options.login_method or M.LOGIN_METHOD_PASSWORD
	if not auth_func(user, credential) then
		return consts.LOGIN_BAD_CREDENTIALS
	end

	if user.active == 0 then
		return consts.LOGIN_USER_INACTIVE
	elseif user.active == -1 then
		return consts.LOGIN_USER_BANNED
	end

	if not nosession then
		local sessionid = random.string(32)
		ngx.header['Set-Cookie'] = {"sessionid=" .. sessionid .. "; HttpOnly; Path=/; Secure;"}
		ngx.ctx.sessionid = sessionid

		sessionid = "sessions:" .. sessionid

		local redis_inst = redis.get_shared()
		redis_inst:hmset(sessionid, "id", user.id, "loginkey", ngx.encode_base64(auth_utils.hash_login_key(user.loginkey)))
		redis_inst:expire(sessionid, SESSION_EXPIRE_DELAY)
	end

	ngx.ctx.user = user

	return consts.LOGIN_SUCCESS
end

function M.logout()
	ngx.header['Set-Cookie'] = {"sessionid=NULL; HttpOnly; Path=/; Secure;", "loginkey=NULL; HttpOnly; Path=/; Secure;"}
	if ngx.ctx.sessionid then
		redis.get_shared():del("sessions:" .. ngx.ctx.sessionid)
	end
	ngx.ctx.user = nil
end

function M.check_cookies()
	local cookies = ngx.var.http_Cookie
	if cookies then
		local sessionid = ngx.re.match(cookies, "^(.*; *)?sessionid=([a-zA-Z0-9]+)( *;.*)?$", "o")
		if sessionid then
			local redis_inst = redis.get_shared()
			sessionid = sessionid[2]
			local sessionKey = "sessions:" .. sessionid
			local result = redis_inst:hmget(sessionKey, "id", "loginkey")
			if (not utils.is_falsy_or_null(result)) and
					M.login(result[1], result[2], {
						nosession = true, login_with_id = true, login_method = M.LOGIN_METHOD_LOGINKEY
					}) == consts.LOGIN_SUCCESS then
				ngx.ctx.sessionid = sessionid
				ngx.header['Set-Cookie'] = {"sessionid=" .. sessionid .. "; HttpOnly; Path=/; Secure;"}
				redis_inst:expire(sessionKey, SESSION_EXPIRE_DELAY)
			end
		end

		local loginkey = ngx.re.match(cookies, "^(.*; *)?loginkey=([0-9a-f-]+)\\.([a-zA-Z0-9+/=]+)( *;.*)?$", "o")
		if loginkey then
			if ngx.ctx.user then
				ngx.ctx.remember_me = true
				auth_utils.send_login_key()
			else
				if M.login(loginkey[2], loginkey[3], {
								login_with_id = true, login_method = M.LOGIN_METHOD_LOGINKEY
							}) == consts.LOGIN_SUCCESS then
					ngx.ctx.remember_me = true
					auth_utils.send_login_key()
				end
			end
		end

		if (sessionid or loginkey) and not ngx.ctx.user then
			M.logout()
		end
	end
end

local function parse_authorization_header(auth)
	if not auth then
		return
	end
	if auth:sub(1, 6):lower() ~= "basic " then
		return
	end
	auth = ngx.decode_base64(auth:sub(7))
	if not auth or auth == "" then
		return
	end
	local colonPos = auth:find(":", 1, true)
	if not colonPos then
		return
	end
	return auth:sub(1, colonPos - 1), auth:sub(colonPos + 1)
end

function M.check_api_login()
	local user, apikey = parse_authorization_header(ngx.var.http_authorization)
	if user and apikey then
		local success = (M.login(user, apikey, {
							nosession = true, login_method = M.LOGIN_METHOD_APIKEY
						}) == consts.LOGIN_SUCCESS)
		if not success then
			utils.api_error("Invalid username or API key", 401)
			return true
		end
	end
end

return M
