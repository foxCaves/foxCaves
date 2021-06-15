local ROUTE_TREE = {
    children = {},
    methods = {},
}

local c_open, c_close = ('{}'):byte(1,2)

local dofile = dofile
local explode = explode
local pairs = pairs

local function add_route(url, method, file)
    file = "/pages/" .. file .. ".lua"

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
    for method in pairs(methods) do
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

add_route("/", "GET", "index")

add_route_simple("cam", {"GET"})
add_route_simple("email", {"GET", "POST"})
add_route_simple("emailcode", {"GET"})
add_route_simple("cam", {"GET"})
add_route_simple("gopro", {"GET"})
add_route_simple("login", {"GET", "POST"})
add_route_simple("myaccount", {"GET", "POST"})
add_route_simple("myfiles", {"GET"})
add_route_simple("mylinks", {"GET"})
add_route_simple("register", {"GET", "POST"})
add_route_simple("register", {"GET"})
add_route("/error/{code}", "GET", "error")
add_route("/legal/{page}", "GET", "legal")
add_route("/live/{id}", "GET", "live")
add_route("/view/{id}", "GET", "view")

add_route_simple("api/base64", {"GET"})
add_route_simple("api/convert", {"GET"})
add_route_simple("api/create", {"POST"})
add_route_simple("api/delete", {"GET"})
add_route_simple("api/deletelink", {"GET"})
add_route_simple("api/events", {"GET"})
add_route_simple("api/filehtml", {"GET"})
add_route_simple("api/linkhtml", {"GET"})
add_route_simple("api/links", {"GET"})
add_route_simple("api/list", {"GET"})
add_route_simple("api/livedraw", {"GET"})
add_route_simple("api/livedraw_ws", {"GET"})
add_route_simple("api/shorten", {"GET", "POST"})
