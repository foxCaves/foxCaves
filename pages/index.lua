dofile(ngx.var.main_root.."/scripts/global.lua")

dofile("scripts/navtbl.lua")
navtbl[1].active = true
ngx.print(load_template("index", {MAINTITLE = "Home", ADDLINKS = build_nav(navtbl)}))
ngx.eof()
