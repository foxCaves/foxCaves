-- ROUTE:GET:/api/v1/files/{id}/base64
dofile(ngx.var.main_root .. "/scripts/global.lua")
dofile("scripts/api_login.lua")
if not ngx.ctx.user then return end

dofile("scripts/fileapi.lua")

local succ, data = file_download(ngx.ctx.route_vars.id, ngx.ctx.user.id)
if(not succ) then
	ngx.status = 403
	ngx.print("failed")
	return ngx.eof()
end
ngx.print(ngx.encode_base64(data))
ngx.eof()
