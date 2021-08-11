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

-- BEGIN: chdir to script's path
ngx.log(ngx.ERR, debug.getinfo(1, "S").source)
require("lfs").chdir(debug.getinfo(1, "S").source:sub(2):match("(.*/)") .. "/../")
-- END:   chdir to script's path

package.path = package.path .. ";core/modules/?.lua"
