dofile(ngx.var.main_root .. "/scripts/global.lua")

local error_num = tonumber(ngx.var.error_code or "400")

ngx.status = error_num

dofile("scripts/navtbl.lua")
ngx.print(load_template("error", {MAINTITLE = "Error " .. error_num, ERROR_NUM = error_num, ADDLINKS = build_nav(navtbl)}))
ngx.eof()
