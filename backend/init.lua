local error = error
local tostring = tostring
local pairs = pairs
local rawset = rawset
local os = os
_G.dns_query_timeout = 10 * 1000

local init_ran = _G.init_ran

require("path")
require("lfs")

-- Protect global table
local function protect_table(tbl, name)
    setmetatable(tbl, {
        __index = function(t, k)
            error("Attempt to read unknown from table " .. name .. ": " .. k)
        end,
        __newindex = function(t, k)
            error("Attempt to write to _" .. name .. ": " .. k)
        end,
        __metatable = false,
    })
end

local function run_init()
    if init_ran then
        return
    end
    _G.init_ran = true

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

    rawset(_G, "rawget", nil)
    rawset(_G, "rawset", nil)

    for k, v in pairs(_G) do
        if k:sub(1, 1) ~= "_" then
            protect_table(v, k)
        end
    end
    protect_table(_G, "_G")

    -- Load module path
    local path = require("path")
    local root = path.abs(debug.getinfo(1, "S").source:sub(2):match("(.*/)"))
    package.path = package.path .. ";" .. path.abs(root .. "/modules"):gsub("//+", "/") .. "/?.lua;"

    -- Secure cjson
    local cjson = require("cjson")
    cjson.decode_max_depth(10)
    cjson.decode_invalid_numbers(false)
end

run_init()
