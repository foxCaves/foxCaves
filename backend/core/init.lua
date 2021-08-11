-- Load modules, ensure they don't leave globals behind
local path = require("path")
_G.path = nil
require("lfs")
_G.lfs = nil

-- Load paths
local CORE_ROOT = path.abs(debug.getinfo(1, "S").source:sub(2):match("(.*/)"))
LUA_ROOT = path.abs(CORE_ROOT .. "/../")
ROOT = path.abs(LUA_ROOT .. "/../")
package.path = package.path .. ";" .. path.abs(CORE_ROOT .. "/modules") .. "/?.lua"

-- Load environment vars
OSENV = {
	ENVIRONMENT = true
}
for k, _ in pairs(OSENV) do
	OSENV[k] = os.getenv(k)
end

-- Protect global table
setmetatable(_G, {
	__index = function(t, k)
		error("Attempt to read unknown from _G: " .. k)
	end,
	__newindex = function(t, k, v)
		error("Attempt to write to _G: " .. k)
	end,
})
