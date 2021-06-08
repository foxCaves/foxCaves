dofile(ngx.var.main_root .. "/scripts/global.lua")
dofile("scripts/api_login.lua")
if not ngx.ctx.user then return end

dofile("scripts/fileapi.lua")

local res, _ = file_delete(ngx.var.arg_id, ngx.ctx.user.id)

if not res then
	ngx.status = 400
end

ngx.eof()
