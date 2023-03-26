local error = error
_G.dns_query_timeout = 10 * 1000

require("path")
require("lfs")

-- Protect global table
local function protect_table(tbl, name)
    setmetatable(tbl, {
        __index = function(_, k)
            error("Attempt to read unknown from table " .. name .. ": " .. k)
        end,
        __newindex = function(_, k)
            error("Attempt to write to _" .. name .. ": " .. k)
        end,
        __metatable = false,
    })
end

-- Load environment vars
rawset(_G, "OSENV", {
    ENVIRONMENT = true
})
for k, _ in pairs(OSENV) do
    rawset(OSENV, k, os.getenv(k))
end

rawset(os, "exit", nil)
rawset(os, "execute", nil)

local _jit = jit
rawset(_G, "jit", {
    version = _jit.version,
    version_num = _jit.version_num,
    arch = _jit.arch,
    opt = {},
})

local _debug = debug
rawset(_G, "debug", {
    getupvalue = _debug.getupvalue,
    getlocal = _debug.getlocal,
    getinfo = _debug.getinfo,
    traceback = _debug.traceback,
})

for k, v in pairs(_G) do
    if not getmetatable(v) and type(v) == "table" then
        protect_table(v, k)
    end
end

-- Load module path
local path = require("path")
local root = path.abs(debug.getinfo(1, "S").source:sub(2):match("(.*/)"))
package.path = package.path .. ";" .. path.abs(root .. "/modules"):gsub("//+", "/") .. "/?.lua;"

-- Secure cjson
local cjson = require("cjson")
cjson.decode_max_depth(10)
cjson.decode_invalid_numbers(false)

require("foxcaves.random").seed()
