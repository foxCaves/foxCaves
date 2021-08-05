-- ROUTE:GET:/api/v1/files/{id}/base64
dofile_global()
dofile("scripts/api_login.lua")
if not ngx.ctx.user then return end

dofile("scripts/fileapi.lua")

local succ, data = file_download(ngx.ctx.route_vars.id, ngx.ctx.user.id)
if(not succ) then
	ngx.status = 403
	ngx.print("failed")
	return
end
ngx.print(ngx.encode_base64(data))
