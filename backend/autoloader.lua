local require = require
local type = type
local ngx = ngx
local package = package
local lfs = require('lfs')
local MODULE_ROOT = require('foxcaves.consts').MODULE_ROOT

require('foxcaves.module_helper').setmodenv()

local function load_module(absfile)
    local mod_name = absfile:sub(MODULE_ROOT:len() + 1):gsub('%.lua$', ''):gsub('/', '.')
    if package.loaded[mod_name] then
        ngx.log(ngx.DEBUG, 'module already loaded: ' .. mod_name)
        return
    end

    local mod = require(mod_name)
    if type(mod) ~= 'table' then
        ngx.log(ngx.WARN, 'module did not return table: ' .. mod_name)
    end
end

local function scan_module_dir(dir)
    while dir:sub(-1) == '/' do
        dir = dir:sub(1, -2) -- remove trailing slashes
    end

    for file in lfs.dir(dir) do
        if file:sub(1, 1) ~= '.' then
            local absfile = dir .. '/' .. file
            local attributes = lfs.attributes(absfile)
            if attributes.mode == 'file' then
                if file:sub(-4) == '.lua' then
                    load_module(absfile)
                end
            elseif attributes.mode == 'directory' then
                scan_module_dir(absfile)
            end
        end
    end
end

scan_module_dir(MODULE_ROOT)
