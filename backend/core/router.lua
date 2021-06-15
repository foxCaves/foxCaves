local ROUTE_TREE = {
    children = {},
    methods = {},
}

local c_open, c_close = ('{}'):byte(1,2)

local dofile = dofile
local explode = explode
local pairs = pairs

local function add_route(url, method, file)
    file = "/pages/" .. file

    method = method:upper()
    local urlsplit = explode("/", url:sub(2))

    local mappings = {}
    local route = ROUTE_TREE
    for i, rawseg in pairs(urlsplit) do
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

    route.methods[method] = {
        file = file,
        mappings = mappings,
        id = method .. " " .. url,
    }
end

local function add_route_simple(file, methods)
    local url = "/" .. file:sub(1, file:find(".", 1, true) - 1)
    for _, method in pairs(methods) do
        add_route(url, method, file)
    end
end

function execute_route()
    local override = ngx.var.run_lua_file
    if override and override:len() > 0 then
        dofile(override)
        return
    end

    local url = ngx.var.uri
    local method = ngx.var.request_method:upper()
    local urlsplit = explode("/", url:sub(2))

    local candidate = ROUTE_TREE

    for i, seg in pairs(urlsplit) do
        candidate = candidate.children[seg] or candidate.children['*']
        if not candidate then
            ngx.exit(404)
            return
        end
    end

    local handler = candidate.methods[method]
    if not handler then
        ngx.exit(405)
        return
    end

    ngx.ctx.route_vars = {}
    for i, mapping in pairs(handler.mappings) do
        ngx.ctx.route_vars[mapping] = urlsplit[i]
    end
    dofile(ngx.var.main_root .. handler.file)
end

add_route("/", "GET", "index.lua")

add_route_simple("cam.lua", {"GET"})
add_route_simple("email.lua", {"GET", "POST"})
add_route_simple("emailcode.lua", {"GET"})
add_route_simple("cam.lua", {"GET"})
add_route_simple("gopro.lua", {"GET"})
add_route_simple("login.lua", {"GET", "POST"})
add_route_simple("myaccount.lua", {"GET", "POST"})
add_route_simple("myfiles.lua", {"GET"})
add_route_simple("mylinks.lua", {"GET"})
add_route_simple("register.lua", {"GET", "POST"})
add_route_simple("register.lua", {"GET"})
add_route("/error/{code}", "GET", "error.lua")
add_route("/legal/{page}", "GET", "legal.lua")
add_route("/live/{id}", "GET", "live.lua")
add_route("/view/{id}", "GET", "view.lua")

add_route_simple("api/base64.lua", {"GET"})
add_route_simple("api/convert.lua", {"GET"})
add_route_simple("api/create.lua", {"POST"})
add_route_simple("api/delete.lua", {"GET"})
add_route_simple("api/deletelink.lua", {"GET"})
add_route_simple("api/events.lua", {"GET"})
add_route_simple("api/filehtml.lua", {"GET"})
add_route_simple("api/linkhtml.lua", {"GET"})
add_route_simple("api/links.lua", {"GET"})
add_route_simple("api/list.lua", {"GET"})
add_route_simple("api/livedraw.lua", {"GET"})
add_route_simple("api/livedraw_ws.lua", {"GET"})
add_route_simple("api/shorten.lua", {"GET", "POST"})
