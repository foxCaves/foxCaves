local error = error
local setmetatable = setmetatable
_G.dns_query_timeout = 10 * 1000

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
local modules_root = os.getenv('LUA_ROOT') .. '/modules'
package.path = package.path .. ';' .. modules_root:gsub('//+', '/') .. '/?.lua;'
local consts = dofile(modules_root .. '/foxcaves/consts.lua')
rawset(_G, 'LUA_ROOT', consts.LUA_ROOT)

-- Secure cjson
local cjson = require('cjson')
cjson.decode_max_depth(10)
cjson.decode_invalid_numbers(false)
