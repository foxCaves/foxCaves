local error = error
local setmetatable = setmetatable
_G.dns_query_timeout = 10 * 1000

require('path')
require('lfs')

local function protect_table(tbl, name)
    return setmetatable(tbl, {
        __index = function(_, k)
            error('Attempt to read unknown from table ' .. name .. ': ' .. k)
        end,
        __newindex = function(_, k)
            error('Attempt to write to _' .. name .. ': ' .. k)
        end,
        __metatable = false,
    })
end
rawset(_G, 'protect_table', protect_table)

-- Load environment vars
rawset(_G, 'OSENV', {
    ENVIRONMENT = true,
    CAPTCHA_FONT = true,
})
for k, _ in pairs(OSENV) do
    rawset(OSENV, k, os.getenv(k))
end

rawset(os, 'exit', nil)
rawset(os, 'execute', nil)

-- Remove not-to-be-used functions
local _jit = jit
rawset(_G, 'jit', {
    version = _jit.version,
    version_num = _jit.version_num,
    arch = _jit.arch,
    opt = {},
})

local _debug = debug
rawset(_G, 'debug', {
    getupvalue = _debug.getupvalue,
    getlocal = _debug.getlocal,
    getinfo = _debug.getinfo,
    traceback = _debug.traceback,
})

-- Protect global table(s)
for k, v in pairs(_G) do
    if not getmetatable(v) and type(v) == 'table' then
        protect_table(v, k)
    end
end

-- Load module path
local path = require('path')
local root = path.abs(debug.getinfo(1, 'S').source:sub(2):match('(.*/)'))
package.path = package.path .. ';' .. path.abs(root .. '/modules'):gsub('//+', '/') .. '/?.lua;'

rawset(_G, 'LUA_ROOT', path.abs(root))

-- Secure cjson
local cjson = require('cjson')
cjson.decode_max_depth(10)
cjson.decode_invalid_numbers(false)

require('foxcaves.random').seed()
