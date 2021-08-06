dofile("/var/www/foxcaves/config/main.lua")

MAIN_DIR = "/var/www/foxcaves/lua/"
lfs = require("lfs")
cjson = require("cjson")
argon2 = require("argon2")
lfs.chdir(MAIN_DIR)

dofile("core/main.lua")

collectgarbage("collect")
