CONFIG = {}

setmetatable(_G, {
	__index = function(t, k)
		error("Attempt to read unknown from _G: " .. k)
	end,
	__newindex = function(t, k, v)
		error("Attempt to write to _G: " .. k)
	end,
})

local lfs = require("lfs")

dofile("/var/www/foxcaves/config/" .. require("foxcaves.env").name .. ".lua")

require("foxcaves.router").load()
