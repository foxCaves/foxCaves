lfs = require("lfs")
cjson = require("cjson")
argon2 = require("argon2")
uuid = require("resty.uuid")
lfs.chdir("/var/www/foxcaves/lua/")

dofile("core/main.lua")

collectgarbage("collect")
