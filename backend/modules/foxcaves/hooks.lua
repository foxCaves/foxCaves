local require = require
local pairs = pairs
local next = next
local ngx = ngx
local error = error

local M = {}
require('foxcaves.module_helper').setmodenv()

local hooks_table = {}

local global_only_hooks = { ngx_init = true } -- Called by init_by_lua*, therefor has no ngx.ctx

local function register(tbl, name, func)
    local hook_table = tbl[name]
    if not hook_table then
        hook_table = {}
        hooks_table[name] = hook_table
    end

    hook_table[func] = true
end

local function unregister(tbl, name, func)
    local hook_table = tbl[name]
    if not hook_table then return end

    hook_table[func] = nil
    if next(hook_table) == nil then
        hooks_table[name] = nil
    end
end

local function call(tbl, name, ...)
    local hook_table = tbl[name]
    if not hook_table then return end

    for func in pairs(hook_table) do
        func(...)
    end
end

function M.register_global(name, func)
    register(hooks_table, name, func)
end

function M.unregister_global(name, func)
    unregister(hooks_table, name, func)
end

function M.register_ctx(name, func)
    if global_only_hooks[name] then
        error("Cannot register context hook for '" .. name .. "' as it is a global-only hook.")
    end

    local tbl = ngx.ctx.hooks_table
    if not tbl then
        tbl = {}
        ngx.ctx.hooks_table = tbl
    end
    register(tbl, name, func)
end

function M.unregister_ctx(name, func)
    local tbl = ngx.ctx.hooks_table
    if not tbl then return end

    unregister(tbl, name, func)
    if next(tbl) == nil then
        ngx.ctx.hooks_table = nil
    end
end

function M.call(name, ...)
    call(hooks_table, name, ...)
    if not global_only_hooks[name] and ngx.ctx.hooks_table then
        call(ngx.ctx.hooks_table, name, ...)
    end
end

return M
