dofile("/var/www/doripush/scripts/global.lua")

local name = ngx.var.REQUEST_URI
local nameregex = ngx.re.match(name, "view/([ a-zA-Z0-9._-]*?)$", "o")

if (not nameregex) or (not nameregex[1]) then
	ngx.status = 403
	ngx.print("Invalid filename")
	return ngx.eof()
end

nameregex = nameregex[1]

local database = ngx.ctx.database
local file = database:query(
	"SELECT f.fileid, f.thumbnail, f.type, f.name, u.username, u.pro_expiry, f.time, f.extension, f.size FROM files AS f, users AS u WHERE f.fileid = '"..nameregex.."' AND f.user = u.id LIMIT 0,1"
)
if (not file) or (not file[1])  then
	ngx.status = 404
	ngx.print("File not found")
	return ngx.eof()
end
file = file[1]

dofile("scripts/navtbl.lua")
dofile("scripts/mimetypes.lua")
ngx.print(load_template("view", {
	MAINTITLE = "View file - " .. file.name,
	ADDLINKS = build_nav(navtbl),
	FILE = file,
	MIMETYPES = mimetypes,
	FILE_TYPE_OTHER = 0,
	FILE_TYPE_IMAGE = 1,
	FILE_TYPE_TEXT = 2,
	FILE_TYPE_VIDEO = 3,
	FILE_TYPE_AUDIO = 4,
	FILE_TYPE_APPLICATION = 5
	--HIDE_ADS = (file.pro_expiry >= ngx.time())
}))
ngx.eof()
