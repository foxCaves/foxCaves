-- BEGIN: Permissible _G vars, due to silly libraries
lfs = false
-- END:   Permissible _G vars, due to silly libraries

setmetatable(_G, {
	__index = function(t, k)
		error("Attempt to read unknown from _G: " .. k)
	end,
	__newindex = function(t, k, v)
		error("Attempt to write to _G: " .. k)
	end,
})

require("lfs").chdir("/var/www/foxcaves/lua")
package.path = package.path .. ";core/modules/?.lua"

dofile("/var/www/foxcaves/config/" .. require("foxcaves.env").name .. ".lua")

collectgarbage("collect")
