dofile("/var/www/doripush/scripts/global.lua")
if not ngx.ctx.user then return ngx.redirect("/login") end

local database = ngx.ctx.database

local args = ngx.req.get_uri_args()

local message = ""

if args.delete then
	dofile("scripts/fileapi.lua")
	local isok, name = file_delete(args.delete, ngx.ctx.user.id)
	if isok then
		message = '<div class="alert alert-success">Deleted '..name..'<a href="/myfiles" class="close" data-dismiss="alert">x</a></div>'
	else
		message = '<div class="alert alert-error">Could not delete the file :(<a href="/myfiles" class="close" data-dismiss="alert">x</a></div>'
	end
end

dofile("scripts/navtbl.lua")
navtbl[2].active = true
local files = database:query("SELECT type, name, time, extension, fileid, thumbnail, size FROM files WHERE user = '"..ngx.ctx.user.id.."' ORDER BY time DESC;")
ngx.print(load_template("myfiles", {MAINTITLE = "My files", MESSAGE = message, ADDLINKS = build_nav(navtbl), FILES = files}))
ngx.eof()
