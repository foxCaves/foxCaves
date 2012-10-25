dofile("/var/www/doripush/scripts/global.lua")

local name = ngx.var.REQUEST_URI
local nameregex = ngx.re.match(name, "live/([a-zA-Z0-9]+)\\?([a-zA-Z0-9]+)$", "o")

if (not nameregex) or (not nameregex[1]) then
	ngx.status = 403
	ngx.print("Invalid filename")
	return ngx.eof()
end

local sid = nameregex[2]
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

if file.type ~= 1 then
	ngx.status = 400
	ngx.print("Not an image")
	return ngx.eof()
end

if file.pro_expiry < ngx.time() then
	ngx.status = 403
	ngx.print("Author of file is not pro")
	return ngx.eof()
end

dofile("scripts/navtbl.lua")
ngx.print(load_template("live", {
	MAINTITLE = "Live drawing file - " .. file.name,
	ADDLINKS = build_nav(navtbl),
	FILE = file,
	LDSID = sid
}))
ngx.eof()
