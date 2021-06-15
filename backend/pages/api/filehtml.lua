-- ROUTE:GET:/api/filehtml
-- ROUTE:GET:/api/v1/files/{id}/html
dofile(ngx.var.main_root .. "/scripts/global.lua")
dofile("scripts/api_login.lua")
if not ngx.ctx.user then return end

dofile("scripts/fileapi.lua")

local fileid = ngx.ctx.route_vars.id or ngx.var.arg_id
local file = file_get(fileid)

if not file then
	ngx.status = 404
	ngx.print("File not found")
	return ngx.eof()
end

printTemplateAndClose("filehtml", {fileid = fileid, file = file})
