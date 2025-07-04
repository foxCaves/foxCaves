local require = require
local pairs = pairs

local M = {}
require('foxcaves.module_helper').setmodenv()

local module_table =
    {
        require('foxcaves.acme'),
        require('foxcaves.expiry_manager'),
        require('foxcaves.migrator'),
        require('foxcaves.random'),
    }

function M.call(name, ...)
    local funcname = 'hook_' .. name
    local func
    for _, mod in pairs(module_table) do
        func = mod[funcname]
        if func then
            func(...)
        end
    end
end

return M
