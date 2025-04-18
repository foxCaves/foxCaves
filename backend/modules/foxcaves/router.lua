local lfs = require('lfs')
local cjson = require('cjson')
local utils = require('foxcaves.utils')
local auth = require('foxcaves.auth')
local csrf = require('foxcaves.csrf')
local consts = require('foxcaves.consts')
local env = require('foxcaves.env')
local module_helper = require('foxcaves.module_helper')

local explode = utils.explode
local type = type
local next = next
local ngx = ngx
local loadfile = loadfile
local setfenv = setfenv
local setmetatable = setmetatable
local error = error
local table = table

local G = _G

local ROUTES_ROOT = require('path').abs(consts.LUA_ROOT .. '/routes')

local M = {}
require('foxcaves.module_helper').setmodenv()

local ROUTE_REG_MT = {}
local ROUTE_REG_TABLE = setmetatable(
    {},
    {
        __index = function(_, k)
            if k == 'R' then
                return ROUTE_REG_MT
            end
            return G[k] or error('Accessing on ROUTE table: ' .. k)
        end,
        __newindex = function(_, k)
            error('Assigning on ROUTE table: ' .. k)
        end,
    }
)

local ROUTE_TREE = {
    children = {},
    methods = {},
}
local ROUTE_TABLE = { ['/'] = ROUTE_TREE.methods }

local BASE_OPTS = {
    check_login = true,
    allow_guest = false,
}
function ROUTE_REG_MT.make_route_opts(opts)
    if not opts then
        return BASE_OPTS
    end

    for k, v in next, BASE_OPTS do
        if opts[k] == nil then
            opts[k] = v
        end
    end
    return opts
end

local BASE_OPTS_ANON = ROUTE_REG_MT.make_route_opts({
    check_login = false,
    allow_guest = true,
})
function ROUTE_REG_MT.make_route_opts_anon()
    return BASE_OPTS_ANON
end

local BASE_OPTS_ADMIN = ROUTE_REG_MT.make_route_opts({ require_admin = true })
function ROUTE_REG_MT.make_route_opts_admin()
    return BASE_OPTS_ADMIN
end

local c_open, c_close, c_star = ('{}*'):byte(1, 3)

function ROUTE_REG_MT.register_route_multi_method(url, methods, options, func, descriptor)
    for _, method in next, methods do
        ROUTE_REG_MT.register_route(url, method, options, func, descriptor)
    end
end

function ROUTE_REG_MT.register_route(url, method, options, func, descriptor)
    method = method:upper()
    local urlsplit = explode('/', url:sub(2))

    local route_id = method .. ' ' .. url

    local mappings = {}
    local route = ROUTE_TREE
    for i, rawseg in next, urlsplit do
        local rawseg_len = rawseg:len()
        local seg = rawseg
        if rawseg:byte(1) == c_open and rawseg:byte(rawseg_len) == c_close then
            local rawseg_off
            if rawseg:byte(2) == c_star then
                seg = '**'
                rawseg_off = 3
            else
                seg = '*'
                rawseg_off = 2
            end
            mappings[i] = rawseg:sub(rawseg_off, rawseg_len - 1)
        end
        local newroute = route.children[seg]
        if not newroute then
            newroute = {
                children = {},
                methods = {},
            }
            route.children[seg] = newroute
        end
        route = newroute
    end

    if route.methods[method] then
        ngx.log(ngx.ERR, 'Double registration for route handler for ' .. route_id)
    end

    ROUTE_TABLE[url] = route.methods

    local route_tbl = {
        mappings = mappings,
        id = route_id,
        url = url,
        method = method,
        func = setfenv(func, module_helper.EMPTY_TABLE),
        options = options,
        descriptor = descriptor,
    }

    route.methods[method] = route_tbl
end

function ROUTE_REG_MT.get_table()
    return ROUTE_TABLE
end

local function scan_route_file(file)
    file = file:gsub('//+', '/')

    local func, err = loadfile(file)
    if not func then
        error('Error loading route: ' .. err)
    end
    setfenv(func, ROUTE_REG_TABLE)()
end

local function scan_route_dir(dir)
    for file in lfs.dir(dir) do
        if file:sub(1, 1) ~= '.' then
            local absfile = dir .. '/' .. file
            local attributes = lfs.attributes(absfile)
            if attributes.mode == 'file' then
                scan_route_file(absfile)
            elseif attributes.mode == 'directory' then
                scan_route_dir(absfile)
            end
        end
    end
end

local function route_execute()
    local url = ngx.var.uri
    local method = ngx.var.request_method:upper()
    local urlsplit = explode('/', url:sub(2))

    local candidate = ROUTE_TREE

    local wildcard_i = 0

    for i, seg in next, urlsplit do
        local old_candidate = candidate
        candidate = old_candidate.children[seg] or old_candidate.children['*']
        if not candidate then
            candidate = old_candidate.children['**']
            if candidate then
                wildcard_i = i
                break
            end
            return {}, utils.api_error('Route not found', 404)
        end
    end

    local handler = candidate.methods[method]
    if not handler then
        return {}, utils.api_error('Invalid method for route', 404)
    end

    local route_vars = {}
    for i, mapping in next, handler.mappings do
        if i ~= wildcard_i then
            route_vars[mapping] = ngx.unescape_uri(urlsplit[i])
        end
    end
    if wildcard_i > 0 then
        local wildcard_map = handler.mappings[wildcard_i]
        local res = {}
        for i = wildcard_i, #urlsplit do
            table.insert(res, urlsplit[i])
        end
        route_vars[wildcard_map] = table.concat(res, '/')
    end

    ngx.header['FoxCaves-Route-ID'] = handler.id
    if env.id == consts.ENV_TESTING then
        ngx.header['FoxCaves-Testing-Mode'] = '!WARNING! TESTING MODE ENABLED - THIS IS A SECURITY RISK !WARNING!'
    end

    local opts = handler.options or {}
    ngx.ctx.route_opts = opts
    ngx.ctx.disable_csrf_checks = opts.disable_csrf_checks or false

    if opts.check_login then
        local res, code = auth.check()
        if res then
            return opts, res, code
        end
    end

    if method == 'HEAD' or method == 'OPTIONS' or method == 'GET' then
        ngx.ctx.disable_csrf_checks = true
    end

    if not ngx.ctx.disable_csrf_checks and not csrf.check(ngx.var.http_csrf_token) then
        return opts, utils.api_error('CSRF mismatch', 419)
    end

    if not opts.allow_guest and not ngx.ctx.user then
        return opts, utils.api_error('Not logged in', 403)
    end

    if opts.require_admin and not (ngx.ctx.user and ngx.ctx.user:is_admin()) then
        return opts, utils.api_error('Not admin', 403)
    end

    return opts, handler.func(route_vars)
end

function M.execute()
    local _, res, code = route_execute()

    if not res then return end

    if code then
        ngx.status = code
    end

    if type(res) == 'string' then
        ngx.header['Content-Type'] = 'text/plain'
        ngx.print(res)
    else
        ngx.header['Content-Type'] = 'application/json'
        ngx.print(cjson.encode(res))
    end
end

scan_route_dir(ROUTES_ROOT)

return M
