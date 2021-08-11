require("lfs").chdir("/var/www/foxcaves/lua/")

dofile("core/main.lua")

collectgarbage("collect")
