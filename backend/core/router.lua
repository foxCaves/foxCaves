local ngx_re = require("ngx.re")

local ROUTE_TREE = {
    children = {},
    methods = {},
}

local c_open, c_close = ('{}'):byte(1,2)

local function add_route(url, method, file)
    file = "/pages/" .. file .. ".lua"

    method = method:upper()
    local urlsplit = ngx_re.split(url:sub(2), "/")

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
    }
end

function execute_route()
    local override = ngx.var.run_lua_file
    if override and override:len() > 0 then
        dofile(override)
        return
    end

    local url = ngx.var.uri
    local method = ngx.var.request_method:upper()
    local urlsplit = ngx_re.split(url:sub(2), "/")

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

add_route("/cam", "GET", "cam")
add_route("/email", "GET", "email")
add_route("/email", "POST", "email")
add_route("/emailcode", "GET", "emailcode")
add_route("/error/{code}", "GET", "error")
add_route("/gopro", "GET", "gopro")
add_route("/legal/{page}", "GET", "legal")
add_route("/live/{id}", "GET", "live")
add_route("/login", "GET", "login")
add_route("/login", "POST", "login")
add_route("/myaccount", "GET", "myaccount")
add_route("/myaccount", "POST", "myaccount")
add_route("/myfiles", "GET", "myfiles")
add_route("/mylinks", "GET", "mylinks")
add_route("/register", "GET", "register")
add_route("/register", "POST", "register")
add_route("/view/{id}", "GET", "view")

add_route("/api/base64", "GET", "api/base64")
add_route("/api/convert", "GET", "api/convert")
add_route("/api/create", "POST", "api/create")
add_route("/api/delete", "GET", "api/delete")
add_route("/api/deletelink", "GET", "api/deletelink")
add_route("/api/events", "GET", "api/events")
add_route("/api/filehtml", "GET", "api/filehtml")
add_route("/api/linkhtml", "GET", "api/linkhtml")
add_route("/api/links", "GET", "api/links")
add_route("/api/list", "GET", "api/list")
add_route("/api/liveraw_ws", "GET", "api/livedraw_ws")
add_route("/api/shorten", "GET", "api/shorten")
add_route("/api/shorten", "POST", "api/shorten")

