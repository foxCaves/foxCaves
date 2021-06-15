-- ROUTE:GET:/api/delete
-- ROUTE:DELETE:/api/v1/files/{id}
-- ROUTE:GET:/api/v1/files/{id}/delete
dofile(ngx.var.main_root .. "/scripts/global.lua")
dofile("scripts/api_login.lua")
if not ngx.ctx.user then return end

dofile("scripts/fileapi.lua")

local ok, _ = file_delete(ngx.ctx.route_vars.id or ngx.var.arg_id, ngx.ctx.user.id)

if ngx.var.arg_redirect then
	ngx.redirect("/myfiles?delete_ok=" .. tostring(ok))
	ngx.eof()
	return
end

if not ok then
	ngx.status = 400
end
ngx.eof()
