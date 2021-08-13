-- Protect global table
setmetatable(_G, {
	__index = function(_, k)
		error("Attempt to read unknown from _G: " .. k)
	end,
	__newindex = function(_, k)
		if k == "lfs" or k == "path" then
			return
		end
		error("Attempt to write to _G: " .. k)
	end,
})

-- Load paths
local path = require("path")
local CORE_ROOT = path.abs(debug.getinfo(1, "S").source:sub(2):match("(.*/)"))
rawset(_G, 'LUA_ROOT', path.abs(CORE_ROOT .. "/../"))
rawset(_G, 'ROOT', path.abs(LUA_ROOT .. "/../"))
package.path = package.path .. ";" .. path.abs(CORE_ROOT .. "/modules") .. "/?.lua"

-- Load environment vars
rawset(_G, 'OSENV', {
	ENVIRONMENT = true
})
for k, _ in pairs(OSENV) do
	rawset(OSENV, k, os.getenv(k))
end
