dofile(ngx.var.main_root .. "/scripts/global.lua")
dofile("scripts/api_login.lua")
if not ngx.ctx.user then return end

dofile("scripts/fileapi.lua")

local ok, _ = file_delete(ngx.var.arg_id, ngx.ctx.user.id)

if ngx.var.arg_redirect then
	ngx.redirect(ngx.var.http_referer .. "?delete_ok=" .. tostring(ok))
	ngx.eof()
else
	if not ok then
		ngx.status = 400
	end
	ngx.eof()
end
