local lfs = require("lfs")
local cjson = require("cjson")
local utils = require("foxcaves.utils")
local auth = require("foxcaves.auth")

local explode = utils.explode
local type = type
local next = next
local io = io
local ngx = ngx
local lua_load = load
local setfenv = setfenv
local setmetatable = setmetatable
local error = error

local G = _G

local ROUTES_ROOT = require("path").abs(require("foxcaves.consts").LUA_ROOT .. "/routes")

local M = {}
setfenv(1, M)

local EMPTY_TABLE = setmetatable({}, {
    __index = function(_, k)
        error("Accessing on EMPTY table: " .. k)
    end,
    __newindex = function(_, k)
        error("Assigning on EMPTY table: " .. k)
    end,
})

local ROUTE_REG_MT = {}
local ROUTE_REG_TABLE = setmetatable({}, {
    __index = function(_, k)
        if k == "R" then
            return ROUTE_REG_MT
        end
        return G[k] or error("Accessing on ROUTE table: " .. k)
    end,
    __newindex = function(_, k)
        error("Assigning on ROUTE table: " .. k)
    end,
})

local ROUTE_TREE = {
    children = {},
    methods = {},
}

local BASE_OPTS = {
    cookie_login = true,
    api_login = true,
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
    cookie_login = false,
    api_login = false,
    allow_guest = true,
})
function ROUTE_REG_MT.make_route_opts_anon()
    return BASE_OPTS_ANON
end

local c_open, c_close = ('{}'):byte(1,2)

function ROUTE_REG_MT.register_route(url, method, options, func)
    method = method:upper()
    local urlsplit = explode("/", url:sub(2))

    local route_id = method .. " " .. url

    local mappings = {}
    local route = ROUTE_TREE
    for i, rawseg in next, urlsplit do
        local rawseg_len = rawseg:len()
        local seg = rawseg
        if rawseg:byte(1) == c_open and rawseg:byte(rawseg_len) == c_close then
            seg = '*'
            mappings[i] = rawseg:sub(2, rawseg_len - 1)
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
        ngx.log(ngx.ERR, "Double registration for route handler for " .. route_id)
    end

    route.methods[method] = {
        mappings = mappings,
        id = route_id,
        func = setfenv(func, EMPTY_TABLE),
        options = options,
    }
end

local function scan_route_file(file)
    local fh = io.open(file)
    local data = fh:read("*all")
    fh:close()

    local func, err = lua_load(data, file)
    if not func then
        error("Error loading route: " .. err)
    end
    setfenv(func, ROUTE_REG_TABLE)()
end

local function scan_route_dir(dir)
    for file in lfs.dir(dir) do
        if file:sub(1, 1) ~= "." then
            local absfile = dir .. "/" .. file
            local attributes = lfs.attributes(absfile)
            if attributes.mode == "file" then
                scan_route_file(absfile)
            elseif attributes.mode == "directory" then
                scan_route_dir(absfile)
            end
        end
    end
end

function M.execute()
    local url = ngx.var.uri
    local method = ngx.var.request_method:upper()
    local urlsplit = explode("/", url:sub(2))

    local candidate = ROUTE_TREE

    for _, seg in next, urlsplit do
        candidate = candidate.children[seg] or candidate.children['*']
        if not candidate then
            ngx.status = 404
            return
        end
    end

    local handler = candidate.methods[method]
    if not handler then
        ngx.status = 405
        return
    end

    ngx.ctx.route_id = handler.id
    ngx.ctx.route_vars = {}
    for i, mapping in next, handler.mappings do
        ngx.ctx.route_vars[mapping] = urlsplit[i]
    end

    ngx.header["FoxCaves-Route-URL"] = url
    ngx.header["FoxCaves-Route-Method"] = method
    ngx.header["FoxCaves-Route-ID"] = handler.id

    local res, code

    local opts = handler.options

    if opts.cookie_login then
        auth.check_cookies()
    end

    if opts.api_login then
        auth.check_api_login()
    end

    if (not opts.allow_guest) and (not ngx.ctx.user) then
        res, code = utils.api_error("Not logged in", 403)
    end

    if not res then
        res, code = handler.func()
        if not res then
            return
        end
    end

    if code then
        ngx.status = code
    end

    if type(res) == "string" then
        ngx.header["Content-Type"] = "text/plain"
        ngx.print(res)
    else
	    ngx.header["Content-Type"] = "application/json"
        if opts.empty_is_array and not next(res) then
            ngx.print('[]')
        else
            ngx.print(cjson.encode(res))
        end
    end
end

scan_route_dir(ROUTES_ROOT)

return M
