local cookies = require("foxcaves.cookies")

local ngx = ngx

local M = {}
require("foxcaves.module_helper").setmodenv()

local LOGIN_KEY_MAX_AGE = 30 * 24 * 60 * 60

function M.hash_login_key(loginkey)
	return ngx.hmac_sha1(loginkey or ngx.ctx.user.loginkey, ngx.var.http_user_agent or ngx.var.remote_addr)
end

function M.send_login_key()
	if not ngx.ctx.remember_me then
		return
	end

	local cookie = cookies:get_instance()
	local expires = ngx.cookie_time(ngx.time() + LOGIN_KEY_MAX_AGE)
	cookie:set({
		key = "loginkey",
		value = ngx.encode_base64(M.hash_login_key()),
		expires = expires,
		max_age = LOGIN_KEY_MAX_AGE,
	})
end

return M
