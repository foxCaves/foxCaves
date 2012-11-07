dofile(ngx.var.main_root.."/scripts/global.lua")
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
local files = database:zrevrange(database.KEYS.USER_FILES..ngx.ctx.user.id, 0, -1)
dofile("scripts/fileapi.lua")
ngx.print(load_template("myfiles", {MAINTITLE = "My files", MESSAGE = message, ADDLINKS = build_nav(navtbl), FILES = files, file_get = file_get}))
ngx.eof()
