-- ROUTE:DELETE:/api/v1/files/{id}
dofile_global()
dofile("scripts/api_login.lua")
if not ngx.ctx.user then return end

dofile("scripts/fileapi.lua")

local ok, _ = file_delete(ngx.ctx.route_vars.id, ngx.ctx.user.id)
if not ok then
	ngx.status = 400
end
