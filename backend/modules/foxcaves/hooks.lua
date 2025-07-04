local require = require
local pairs = pairs
local next = next

local M = {}
require('foxcaves.module_helper').setmodenv()

local hooks_table = {}

function M.register(name, func)
    local hook_table = hooks_table[name]
    if not hook_table then
        hook_table = {}
        hooks_table[name] = hook_table
    end

    hook_table[func] = true
end

function M.unregister(name, func)
    local hook_table = hooks_table[name]
    if not hook_table then return end

    hook_table[func] = nil
    if next(hook_table) == nil then
        hooks_table[name] = nil
    end
end

function M.call(name, ...)
    local hook_table = hooks_table[name]
    if not hook_table then return end

    for func in pairs(hook_table) do
        func(...)
    end
end

return M
