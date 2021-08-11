require("lfs").chdir("/var/www/foxcaves/lua")
package.path = package.path .. ";core/modules/?.lua"

local loadfile = loadfile
function dofile(file)
	loadfile(file)()
end

local _require = require
function require(m)
	local res = _require(m)
	ngx.log(ngx.ERR, "Requiring " .. m .. "; res = " .. tostring(res))
	return res
end

dofile("core/main.lua")

collectgarbage("collect")
