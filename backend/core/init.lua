local MAINDIR = "/var/www/foxcaves/lua"
require("lfs").chdir(MAINDIR)
package.path = package.path .. ";" .. MAINDIR .. "/core/modules/?.lua"

local loadfile = loadfile
function dofile(file)
	loadfile(file)()
end

dofile("core/main.lua")

collectgarbage("collect")
