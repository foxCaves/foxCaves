local require = require
local pairs = pairs
local registry = require('foxcaves.registry')

local M = {}
require('foxcaves.module_helper').setmodenv()

function M.call(name, ...)
    local funcname = 'hook_' .. name
    local func
    for _, mod in pairs(registry.get_modules()) do
        func = mod[funcname]
        if func then
            func(...)
        end
    end
end

return M
