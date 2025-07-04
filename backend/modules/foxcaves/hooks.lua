local require = require
local pairs = pairs
local type = type
local table = table
local ngx = ngx
local io = io
local lfs = require('lfs')
local MODULE_ROOT = require('foxcaves.consts').MODULE_ROOT

local M = {}
require('foxcaves.module_helper').setmodenv()

local module_table = nil

local function load_hook_file(absfile)
    local mod_name = absfile:sub(MODULE_ROOT:len() + 1):gsub('%.lua$', ''):gsub('/', '.')

    local fh = io.open(absfile, 'r')
    if not fh then
        ngx.log(ngx.ERR, 'failed to open hook module file: ' .. mod_name)
        return
    end
    local hdr = fh:read('*l')
    fh:close()
    if hdr:match('NO_AUTOLOAD') then
        ngx.log(ngx.NOTICE, 'skipping NO_AUTOLOAD module: ' .. mod_name)
        return
    end

    local mod = require(mod_name)
    if type(mod) == 'table' then
        for k, v in pairs(mod) do
            if type(v) == 'function' and k:sub(1, 5) == 'hook_' then
                table.insert(module_table, mod)
                ngx.log(ngx.NOTICE, 'loaded module with hooks: ' .. mod_name)
                return
            end
        end
        ngx.log(ngx.DEBUG, 'no hooks found in: ' .. mod_name)
    else
        ngx.log(ngx.NOTICE, 'module did not return table: ' .. mod_name)
    end
end

local function scan_hook_dir(dir)
    while dir:sub(-1) == '/' do
        dir = dir:sub(1, -2) -- remove trailing slashes
    end

    for file in lfs.dir(dir) do
        if file:sub(1, 1) ~= '.' then
            local absfile = dir .. '/' .. file
            local attributes = lfs.attributes(absfile)
            if attributes.mode == 'file' then
                if file:sub(-4) == '.lua' then
                    load_hook_file(absfile)
                end
            elseif attributes.mode == 'directory' then
                scan_hook_dir(absfile)
            end
        end
    end
end

local function get_table()
    if module_table then
        return module_table
    end

    module_table = {}
    scan_hook_dir(MODULE_ROOT)
    return module_table
end

function M.call(name, ...)
    local funcname = 'hook_' .. name
    local func
    for _, mod in pairs(get_table()) do
        func = mod[funcname]
        if func then
            func(...)
        end
    end
end

return M
