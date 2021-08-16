local ngx = ngx
local table = table
local type = type

local M = {}
require("foxcaves.module_helper").setmodenv()

function M.hash_login_key(loginkey)
	return ngx.hmac_sha1(loginkey or ngx.ctx.user.loginkey, ngx.var.http_user_agent or ngx.var.remote_addr)
end

function M.send_login_key()
	if not ngx.ctx.remember_me then
		return
	end

	local expires = "; Expires=" .. ngx.cookie_time(ngx.time() + (30 * 24 * 60 * 60))
	local hdr = ngx.header['Set-Cookie']
	expires = "loginkey=" .. ngx.ctx.user.id .. "." .. ngx.encode_base64(M.hash_login_key()) ..
				expires .. "; HttpOnly; Path=/; Secure;"
	if type(hdr) == "table" then
		table.insert(hdr, expires)
	elseif hdr then
		ngx.header['Set-Cookie'] = {hdr, expires}
	else
		ngx.header['Set-Cookie'] = {expires}
	end
end

return M
