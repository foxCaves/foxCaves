-- ROUTE:GET:/api/v1/files/{id}/html
dofile(ngx.var.main_root .. "/scripts/global.lua")
dofile("scripts/api_login.lua")
if not ngx.ctx.user then return end

dofile("scripts/fileapi.lua")

local fileid = ngx.ctx.route_vars.id
local file = file_get(fileid)

if not file then
	ngx.status = 404
	ngx.print("File not found")
	return ngx.eof()
end

printTemplateAndClose("filehtml", {
	file = file,
	FILE_TYPE_OTHER = FILE_TYPE_OTHER,
	FILE_TYPE_IMAGE = FILE_TYPE_IMAGE,
	FILE_TYPE_TEXT = FILE_TYPE_TEXT,
	FILE_TYPE_VIDEO = FILE_TYPE_VIDEO,
	FILE_TYPE_AUDIO = FILE_TYPE_AUDIO,
	FILE_TYPE_IFRAME = FILE_TYPE_IFRAME,
})
