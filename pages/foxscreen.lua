dofile("/var/www/foxcaves/scripts/global.lua")

dofile("scripts/navtbl.lua")
ngx.print(load_template("foxscreen", {MAINTITLE = "foxScreen", ADDLINKS = build_nav(navtbl)}))
ngx.eof()
