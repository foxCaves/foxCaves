-- BEGIN: Permissible _G vars, due to silly libraries
lfs = false
-- END:   Permissible _G vars, due to silly libraries

ENVIRONMENT = os.getenv("ENVIRONMENT"):lower()

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

collectgarbage("collect")
