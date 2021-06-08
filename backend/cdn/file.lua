dofile(ngx.var.main_root .. "/scripts/global.lua")
dofile("scripts/fileapi.lua")
dofile("cdn/main.lua")
return send_file("inline")
