-- ROUTE:GET,POST:/view/{id}
dofile(ngx.var.main_root .. "/scripts/global.lua")

local fileid = ngx.ctx.route_vars.id

if not fileid then
	return ngx.exec("/error/400")
end

dofile("scripts/fileapi.lua")
local file = file_get(fileid)
if not file then
	return ngx.exec("/error/404")
end

local database = ngx.ctx.database
local fileowner = database:hget(database.KEYS.USERS .. file.user, "username")

dofile("scripts/mimetypes.lua")
printTemplateAndClose("view", {
	MAINTITLE = "View file - " .. file.name,
	file = file,
	owner = fileowner,
	MIMETYPES = mimetypes,
	FILE_TYPE_OTHER = FILE_TYPE_OTHER,
	FILE_TYPE_IMAGE = FILE_TYPE_IMAGE,
	FILE_TYPE_TEXT = FILE_TYPE_TEXT,
	FILE_TYPE_VIDEO = FILE_TYPE_VIDEO,
	FILE_TYPE_AUDIO = FILE_TYPE_AUDIO,
	FILE_TYPE_IFRAME = FILE_TYPE_IFRAME,
})
