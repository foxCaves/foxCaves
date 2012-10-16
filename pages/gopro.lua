dofile("/var/www/doripush/scripts/global.lua")
if not ngx.ctx.user then return ngx.redirect("/login") end

if ngx.ctx.user.id ~= 1 then
	return ngx.eof()
end

dofile("scripts/items.lua")
dofile("scripts/navtbl.lua")
ngx.print(load_template("gopro", {MAINTITLE = "Go pro", ADDLINKS = build_nav(navtbl), ITEMS = ITEMS}))
ngx.eof()
