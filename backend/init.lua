local error = error
local tostring = tostring
_G.dns_query_timeout = 10 * 1000

-- Protect global table
setmetatable(_G, {
    __index = function(_, k)
        error("Attempt to read unknown from _G: " .. k)
    end,
    __newindex = function(_, k)
        if k == "lfs" or k == "path" or k == "socket" then
            return
        end
        error("Attempt to write to _G: " .. k)
    end,
})

local function protect_table(tbl)
    setmetatable(tbl, {
        __index = function(t, k)
            error("Attempt to read unknown from table " .. tostring(t) .. ": " .. k)
        end,
        __newindex = function(t, k)
            error("Attempt to write to _" .. tostring(t) .. ": " .. k)
        end,
    })
end

-- Load environment vars
rawset(_G, "OSENV", {
    ENVIRONMENT = true
})
for k, _ in pairs(OSENV) do
    rawset(OSENV, k, os.getenv(k))
end

rawset(os, "execute", nil)

local _debug = debug
rawset(_G, "debug", {
    getlocal = _debug.getlocal,
    getinfo = _debug.getinfo,
    traceback = _debug.traceback,
})

protect_table(os)
protect_table(debug)
protect_table(io)
protect_table(math)

-- Load module path
local path = require("path")
local root = path.abs(debug.getinfo(1, "S").source:sub(2):match("(.*/)"))
package.path = package.path .. ";" .. path.abs(root .. "/modules"):gsub("//+", "/") .. "/?.lua;"

-- Secure cjson
local cjson = require("cjson")
cjson.decode_max_depth(10)
cjson.decode_invalid_numbers(false)
