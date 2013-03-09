if ngx.ctx.login then return end

local database = ngx.ctx.database

local SESSION_EXPIRE_DELAY = 7200

local function hash_login_key(loginkey)
	return ngx.hmac_sha1(loginkey or ngx.ctx.user.loginkey, ngx.var.http_user_agent or ngx.var.remote_addr)
end

ngx.ctx.LOGIN_SUCCESS = 1
ngx.ctx.LOGIN_USER_INACTIVE = 0
ngx.ctx.LOGIN_USER_BANNED = -1
ngx.ctx.LOGIN_BAD_PASSWORD = -10

function ngx.ctx.login(username_or_id, password, nosession, login_with_id)
	if ngx.ctx.user then return ngx.ctx.LOGIN_SUCCESS end

	if not username_or_id then
		return ngx.ctx.LOGIN_BAD_PASSWORD
	end

	if not login_with_id then
		username_or_id = database:get(database.KEYS.USERNAME_TO_ID .. username_or_id:lower())
		if (not username_or_id) or (username_or_id == ngx.null) then
			return ngx.ctx.LOGIN_BAD_PASSWORD
		end
	end

	local result = database:hgetall(database.KEYS.USERS .. username_or_id)
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
		if login_with_id or result.password == ngx.hmac_sha1(result.username, password) then
			if not nosession then
				local sessionid
				for i=1, 10 do
					sessionid = randstr(32)
					local res = database:exists(database.KEYS.SESSIONS .. sessionid)
					if (not res) or (res == ngx.null) or (res == 0) then
						break
					else
						sessionid = nil
					end
				end
				if sessionid then
					ngx.header['Set-Cookie'] = {"sessionid=" .. sessionid .. "; HttpOnly"}
					result.sessionid = sessionid

					sessionid = database.KEYS.SESSIONS .. sessionid
					database:set(sessionid, username_or_id)
					database:expire(sessionid, SESSION_EXPIRE_DELAY)
				end
			end

			result.id = username_or_id
			result.pro_expiry = tonumber(result.pro_expiry or 0)
			result.usedbytes = tonumber(result.usedbytes or 0)
			result.bonusbytes = tonumber(result.bonusbytes or 0)
			result.is_pro = (result.pro_expiry > ngx.time())
			if result.is_pro then
				result.totalbytes = 1073741824
			else
				result.totalbytes = 268435456
			end
			result.totalbytes = result.totalbytes + result.bonusbytes
			ngx.ctx.user = result

			return ngx.ctx.LOGIN_SUCCESS
		end
	end

	return ngx.ctx.LOGIN_BAD_PASSWORD
end

function ngx.ctx.logout()
	ngx.header['Set-Cookie'] = {"sessionid=NULL", "loginkey=NULL"}
	if (not ngx.ctx.user) or (not ngx.ctx.user.sessionid) then return end
	database:del(database.KEYS.SESSIONS .. ngx.ctx.user.sessionid)
	ngx.ctx.user = nil
end

function ngx.ctx.send_login_key()
	if not ngx.ctx.user.remember_me then return end
	local expires = "; Expires=" .. ngx.cookie_time(ngx.time() + (30 * 24 * 60 * 60))
	local hdr = ngx.header['Set-Cookie']
	expires = "loginkey=" .. ngx.ctx.user.id .. "." .. ngx.encode_base64(hash_login_key()) .. expires .. "; HttpOnly"
	if type(hdr) == "table" then
		table.insert(hdr, expires)
	elseif hdr then
		ngx.header['Set-Cookie'] = {hdr, expires}
	else
		ngx.header['Set-Cookie'] = {expires}
	end
end

function ngx.ctx.make_new_login_key(userdata)
	local send_userdata = false
	if not userdata then
		userdata = ngx.ctx.user
		if not userdata then
			return
		end
		send_userdata = true
	end

	local str = randstr(64)
	local str_pchan = randstr(32)
	database:hmset(database.KEYS.USERS .. userdata.id, "loginkey", str, "pushchan", str_pchan)

	local allsessions = database:keys(database.KEYS.SESSIONS .. "*")
	if type(allsessions) ~= "table" then allsessions = {} end

	if send_userdata then
		database:multi()
		for _,v in next, allsessions do
			if v ~= userdata.sessionid and database:get(v) == userdata.id then
				database:del(v)
			end
		end
		database:exec()
		ngx.ctx.user.loginkey = str
		ngx.ctx.user.pushchan = str_pchan
		ngx.ctx.send_login_key()
	else
		database:multi()
		for _,v in next, allsessions do
			if database:get(v) == userdata.id then
				database:del(v)
			end
		end
		database:exec()
	end
end

local cookies = ngx.var.http_Cookie
if cookies then
	auth = ngx.re.match(cookies, "^(.*; *)?sessionid=([a-zA-Z0-9]+)( *;.*)?$", "o")
	if auth then
		auth = auth[2]
		if auth then
			local sessID = database.KEYS.SESSIONS .. auth
			local result = database:get(sessID)
			if result and result ~= ngx.null then
				ngx.ctx.login(result, nil, true, true)
				ngx.ctx.user.sessionid = auth
				ngx.header['Set-Cookie'] = {"sessionid=" .. auth .. "; HttpOnly"}
				database:expire(sessID, SESSION_EXPIRE_DELAY)
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
				local result = database:hget(database.KEYS.USERS .. uid, "loginkey")
				if result and result ~= ngx.null then
					if hash_login_key(result) == ngx.decode_base64(auth) then
						ngx.ctx.login(uid, nil, false, true)
						ngx.ctx.user.remember_me = true
						ngx.ctx.send_login_key()
					end
				end
			end
		end
	end
end
