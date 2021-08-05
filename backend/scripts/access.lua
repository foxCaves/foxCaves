if ngx.ctx.login then return end

local database = ngx.ctx.database
local redis = ngx.ctx.redis

local SESSION_EXPIRE_DELAY = 7200

local function hash_login_key(loginkey)
	return ngx.hmac_sha1(loginkey or ngx.ctx.user.loginkey, ngx.var.http_user_agent or ngx.var.remote_addr)
end

ngx.ctx.LOGIN_SUCCESS = 1
ngx.ctx.LOGIN_USER_INACTIVE = 0
ngx.ctx.LOGIN_USER_BANNED = -1
ngx.ctx.LOGIN_BAD_PASSWORD = -10

local KILOBYTE = 1024
local MEGABYTE = KILOBYTE * 1024
local GIGABYTE = MEGABYTE * 1024

local STORAGE_BASE = 1 * GIGABYTE

local function check_auth(userdata, password, options)
	local login_with_apikey = options.login_with_apikey
	if login_with_apikey then
		return userdata.apikey == password
	end

	local authOk = false
	local authNeedsUpdate = false
	if userdata.password:sub(1, 13) == "$fcvhmacsha1$" then
		local pw = userdata.password:sub(14)
		local saltIdx = pw:find("$", 1, true)
		local salt = pw:sub(1, saltIdx - 1)
		pw = pw:sub(saltIdx + 1)
		authOk = ngx.hmac_sha1(salt, password) == pw
		authNeedsUpdate = true
	else
		authOk = argon2.verify(userdata.password, password)
	end
	if authOk and authNeedsUpdate then
		database:query_safe('UPDATE users SET password = "%s" WHERE id = "%s"', argon2.hash_encoded(password, randstr(32)), userdata.id)
	end
	return authOk
end

function ngx.ctx.login(username_or_id, password, options)
	if ngx.ctx.user then return ngx.ctx.LOGIN_SUCCESS end

	options = options or {}
	local nosession = options.nosession
	local login_with_id = options.login_with_id

	if not username_or_id then
		return ngx.ctx.LOGIN_BAD_PASSWORD
	end

	local id_field = login_with_id and "id" or "username"

	local resultarr = database:query_safe('SELECT * FROM users WHERE ' .. id_field .. ' = "%s"', username_or_id)
	if result then
		if result.active then
			result.active = tonumber(result.active)
		else
			result.active = 0
		end
		if result.active == 0 then
			return ngx.ctx.LOGIN_USER_INACTIVE
		elseif result.active == -1 then
			return ngx.ctx.LOGIN_USER_BANNED
		end
		result.id = tonumber(result.id)
		if login_with_id or check_auth(result, password, options) then
			if not nosession then
				local sessionid = randstr(32)
				ngx.header['Set-Cookie'] = {"sessionid=" .. sessionid .. "; HttpOnly; Path=/; Secure;"}
				result.sessionid = sessionid

				sessionid = "sessions:" .. sessionid
				redis:set(sessionid, username_or_id)
				redis:expire(sessionid, SESSION_EXPIRE_DELAY)
			end

			result.usedbytes = tonumber(result.usedbytes or 0)
			result.bonusbytes = tonumber(result.bonusbytes or 0)
			result.totalbytes = STORAGE_BASE + result.bonusbytes
			ngx.ctx.user = result

			return ngx.ctx.LOGIN_SUCCESS
		end
	end

	return ngx.ctx.LOGIN_BAD_PASSWORD
end

function ngx.ctx.logout()
	ngx.header['Set-Cookie'] = {"sessionid=NULL; HttpOnly; Path=/; Secure;", "loginkey=NULL; HttpOnly; Path=/; Secure;"}
	if (not ngx.ctx.user) or (not ngx.ctx.user.sessionid) then return end
	redis:del("sessions:" .. ngx.ctx.user.sessionid)
	ngx.ctx.user = nil
end

function ngx.ctx.send_login_key()
	if not ngx.ctx.user.remember_me then return end
	local expires = "; Expires=" .. ngx.cookie_time(ngx.time() + (30 * 24 * 60 * 60))
	local hdr = ngx.header['Set-Cookie']
	expires = "loginkey=" .. ngx.ctx.user.id .. "." .. ngx.encode_base64(hash_login_key()) .. expires .. "; HttpOnly; Path=/; Secure;"
	if type(hdr) == "table" then
		table.insert(hdr, expires)
	elseif hdr then
		ngx.header['Set-Cookie'] = {hdr, expires}
	else
		ngx.header['Set-Cookie'] = {expires}
	end
end

local cookies = ngx.var.http_Cookie
if cookies then
	local auth

	auth = ngx.re.match(cookies, "^(.*; *)?sessionid=([a-zA-Z0-9]+)( *;.*)?$", "o")
	if auth then
		auth = auth[2]
		if auth then
			local sessID = "sessions:" .. auth
			local result = redis:get(sessID)
			if result and result ~= ngx.null then
				ngx.ctx.login(result, nil, { nosession = true, login_with_id = true })
				ngx.ctx.user.sessionid = auth
				ngx.header['Set-Cookie'] = {"sessionid=" .. auth .. "; HttpOnly; Path=/; Secure;"}
				redis:expire(sessID, SESSION_EXPIRE_DELAY)
			end
		end
	end

	auth = ngx.re.match(cookies, "^(.*; *)?loginkey=([0-9]+)\\.([a-zA-Z0-9+/=]+)( *;.*)?$", "o")
	if auth then
		if ngx.ctx.user then
			ngx.ctx.user.remember_me = true
			ngx.ctx.send_login_key()
		else
			local uid = auth[2]
			auth = auth[3]
			if uid and auth then
				local result = database:query_safe('SELECT loginkey FROM users WHERE id = "%s"', uid)
				if result and result ~= ngx.null then
					if hash_login_key(result) == ngx.decode_base64(auth) then
						ngx.ctx.login(uid, nil, { login_with_id = true })
						ngx.ctx.user.remember_me = true
						ngx.ctx.send_login_key()
					end
				end
			end
		end
	end
end
