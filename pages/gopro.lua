dofile("/var/www/doripush/scripts/global.lua")
if not ngx.ctx.user then return ngx.redirect("/login") end

dofile("scripts/items.lua")
dofile("scripts/navtbl.lua")
ngx.print(load_template("gopro", {MAINTITLE = "Go pro", ADDLINKS = build_nav(navtbl), ITEMS = ITEMS}))
ngx.eof()
