require("lfs").chdir("/var/www/foxcaves/lua")
package.path = package.path .. ";core/modules/?.lua"

local loadfile = loadfile
function dofile(file)
	loadfile(file)()
end

dofile("core/main.lua")

collectgarbage("collect")
