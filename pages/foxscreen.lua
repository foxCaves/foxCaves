dofile("/var/www/doripush/scripts/global.lua")

dofile("scripts/navtbl.lua")
table.insert(navtbl, {
        url = "",
        title = "foxScreen",
        active = true
})
ngx.print(load_template("foxscreen", {MAINTITLE = "foxScreen", ADDLINKS = build_nav(navtbl)}))
ngx.eof()
