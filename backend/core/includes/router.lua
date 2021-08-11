local lfs = require("lfs")
local cjson = require("cjson")

local explode = explode
local type = type
local next = next

local ROUTE_TREE = {
    children = {},
    methods = {},
}

local BASE_OPTS = {
    cookie_login = true,
    api_login = true,
    allow_guest = false,
}
function make_route_opts(opts)
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
local BASE_OPTS_ANON = make_route_opts({
    cookie_login = false,
    api_login = false,
    allow_guest = true,
})
function make_route_opts_anon()
    return BASE_OPTS_ANON
end

local c_open, c_close = ('{}'):byte(1,2)

function register_route(url, method, options, func)
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
        func = func,
        options = options,
    }
end

local function scan_route_file(file)
    local fh = io.open(file)
    local data = fh:read("*all")
    fh:close()

    local func, err = load(data, file)
    if not func then
        error("Error loading route: " .. err)
    end
    func()
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

function execute_route()
    local url = ngx.var.uri
    local method = ngx.var.request_method:upper()
    local urlsplit = explode("/", url:sub(2))

    local candidate = ROUTE_TREE

    for i, seg in next, urlsplit do
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
        check_cookies()
    end

    if opts.api_login then
        if check_api_login() then
            return
        end
    end

    if (not opts.allow_guest) and (not ngx.ctx.user) then
        res, code = api_not_logged_in_error()
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

scan_route_dir("routes")
register_route = nil
make_route_opts = nil
make_route_opts_anon = nil
