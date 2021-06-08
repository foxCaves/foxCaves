dofile(ngx.var.main_root .. "/scripts/global.lua")

local name = ngx.var.REQUEST_URI
local nameregex = ngx.re.match(name, "view/([a-zA-Z0-9]+)$", "o")

if (not nameregex) or (not nameregex[1]) then
	return ngx.exec("/error/403")
end

nameregex = nameregex[1]

dofile("scripts/fileapi.lua")
local file = file_get(nameregex)
if not file then
	return ngx.exec("/error/404")
end

local database = ngx.ctx.database
local fileowner = database:hget(database.KEYS.USERS .. file.user, "username")

dofile("scripts/mimetypes.lua")
printTemplateAndClose("view", {
	MAINTITLE = "View file - " .. file.name,
	FILE = file,
	FILEID = nameregex,
	FILEOWNER = fileowner,
	MIMETYPES = mimetypes,
	FILE_TYPE_OTHER = 0,
	FILE_TYPE_IMAGE = 1,
	FILE_TYPE_TEXT = 2,
	FILE_TYPE_VIDEO = 3,
	FILE_TYPE_AUDIO = 4,
	FILE_TYPE_IFRAME = 5
})
