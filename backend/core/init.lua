require("lfs").chdir("/var/www/foxcaves/lua/")

loadfile("core/main.lua")()

collectgarbage("collect")
