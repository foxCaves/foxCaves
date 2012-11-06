dofile("/var/www/foxcaves/scripts/global.lua")

local name = ngx.var.REQUEST_URI
local nameregex = ngx.re.match(name, "view/([a-zA-Z0-9]+)$", "o")

if (not nameregex) or (not nameregex[1]) then
	ngx.status = 403
	ngx.print("Invalid filename")
	return ngx.eof()
end

nameregex = nameregex[1]

dofile("scripts/fileapi.lua")
local file = file_get(nameregex)
if not file  then
	ngx.status = 404
	ngx.print("File not found")
	return ngx.eof()
end

local database = ngx.ctx.database
local fileowner = database:hget(database.KEYS.USERS..file.user, "username")

dofile("scripts/navtbl.lua")
dofile("scripts/mimetypes.lua")
ngx.print(load_template("view", {
	MAINTITLE = "View file - " .. file.name,
	ADDLINKS = build_nav(navtbl),
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
}))
ngx.eof()
