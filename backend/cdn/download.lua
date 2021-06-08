dofile(ngx.var.main_root .. "/scripts/global.lua")
dofile("scripts/fileapi.lua")
dofile("cdn/main.lua")
ngx.header["Content-Type"] = "application/octet-stream"
return send_file("attachment")
