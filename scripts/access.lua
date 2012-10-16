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
function ngx.ctx.login(username, password, nosession, directlogin)
	if ngx.ctx.user then return ngx.ctx.LOGIN_SUCCESS end

	local result
	if directlogin then
		result = database:query("SELECT * FROM users WHERE id = '"..database:escape(username).."'")
	else
		result = database:query("SELECT * FROM users WHERE username = '"..database:escape(username).."'")
	end
	if result and result[1] then
		result = result[1]
		if result.active == 0 then
			return ngx.ctx.LOGIN_USER_INACTIVE
		elseif result.active == -1 then
			return ngx.ctx.LOGIN_USER_BANNED
		end
		if directlogin or result.password == ngx.hmac_sha1(result.username, password) then
			if not nosession then
				local sessionid
				for i=1,10 do
					sessionid = randstr(32)
					local res = database:query("SELECT 1 FROM sessions WHERE id = '"..sessionid.."'")
					if (not res) or (not res[1]) then
						break
					else
						sessionid = nil
					end
				end
				if sessionid then
					ngx.header['Set-Cookie'] = {"sessionid="..sessionid.."; Secure; HttpOnly"}
					result.sessionid = sessionid
					database:query("INSERT INTO sessions (id, user, expire) VALUES ('"..sessionid.."', '"..result.id.."', UNIX_TIMESTAMP() + "..SESSION_EXPIRE_DELAY..")")
				end
			end
			ngx.ctx.user = result
			return ngx.ctx.LOGIN_SUCCESS
		end
	end

	return ngx.ctx.LOGIN_BAD_PASSWORD
end

function ngx.ctx.logout()
	ngx.header['Set-Cookie'] = {"sessionid=NULL", "loginkey=NULL"}
	if (not ngx.ctx.user) or (not ngx.ctx.user.sessionid) then return end
	database:query("DELETE FROM sessiond WHERE id = '"..ngx.ctx.user.sessionid.."'")
	ngx.ctx.user = nil
end

function ngx.ctx.send_login_key()
	if not ngx.ctx.user.remember_me then return end
	local expires = "; Expires="..ngx.cookie_time(ngx.time() + (30 * 24 * 60 * 60))
	local hdr = ngx.header['Set-Cookie']
	expires = "loginkey="..ngx.ctx.user.id.."."..ngx.encode_base64(hash_login_key())..expires.."; Secure; HttpOnly"
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
	database:query("UPDATE users SET loginkey = '"..str.."' WHERE id = '"..userdata.id.."'")
	if send_userdata then
		database:query("DELETE FROM sessions WHERE user = '"..userdata.id.."' AND id != '"..userdata.sessionid.."'")
		ngx.ctx.user.loginkey = str
		ngx.ctx.send_login_key()
	else
		database:query("DELETE FROM sessions WHERE user = '"..userdata.id.."'")
	end
end

local cookies = ngx.var.http_Cookie
if cookies then
	auth = ngx.re.match(cookies, "^(.*; *)?sessionid=([a-zA-Z0-9]+)( *;.*)?$", "o")
	if auth then
		auth = auth[2]
		if auth then
			local result = database:query("SELECT u.*, s.id AS sessionid FROM users AS u, sessions AS s WHERE s.id = '"..database:escape(auth).."' AND u.id = s.user AND u.active = 1")
			if result and result[1] then
				result = result[1]
				database:query("UPDATE sessions SET expire = UNIX_TIMESTAMP() + "..SESSION_EXPIRE_DELAY.." WHERE id = '"..result.sessionid.."'")
				ngx.ctx.user = result
			end
		end
	end

	auth = ngx.re.match(cookies, "^(.*;\\s)?loginkey=([0-9]+)\\.([a-zA-Z0-9+/=]+)(\\s;.*)?$", "o")
	if auth then
		if ngx.ctx.user then
			ngx.ctx.user.remember_me = true
			ngx.ctx.send_login_key()
		else
			local uid = auth[2]
			auth = auth[3]
			if uid and auth then
				local result = database:query("SELECT username, loginkey FROM users WHERE id = '"..database:escape(uid).."' AND active = 1")
				if result and result[1] then
					result = result[1]
					if hash_login_key(result.loginkey) == ngx.decode_base64(auth) then
						ngx.ctx.login(uid, nil, false, true)
						ngx.ctx.user.remember_me = true
						ngx.ctx.send_login_key()
					end
				end
			end
		end
	end
end
