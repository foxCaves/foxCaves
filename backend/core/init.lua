-- BEGIN: Permissible _G vars, due to silly libraries
lfs = false
-- END:   Permissible _G vars, due to silly libraries

local path = require("path")
local CORE_ROOT = path.abs(debug.getinfo(1, "S").source:sub(2):match("(.*/)"))
LUA_ROOT = path.abs(CORE_ROOT .. "/../")
ROOT = path.abs(LUA_ROOT .. "/../")

OSENV = {
	ENVIRONMENT = os.getenv("ENVIRONMENT")
}

setmetatable(_G, {
	__index = function(t, k)
		error("Attempt to read unknown from _G: " .. k)
	end,
	__newindex = function(t, k, v)
		error("Attempt to write to _G: " .. k)
	end,
})

package.path = package.path .. ";" .. path.abs(CORE_ROOT .. "/modules") .. "/?.lua"
