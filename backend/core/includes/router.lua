local ROUTE_TREE = {
    children = {},
    methods = {},
}

local c_open, c_close = ('{}'):byte(1,2)

local dofile = dofile
local explode = explode
local pairs = pairs

local function add_route(url, method, file, func)
    method = method:upper()
    local urlsplit = explode("/", url:sub(2))
    
    local route_id = method .. " " .. url

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

    if route.methods[method] then
        ngx.log(ngx.ERR, "Double registration for route handler for " .. route_id)
    end

    route.methods[method] = {
        file = file,
        mappings = mappings,
        id = route_id,
        func = func,
    }
end

local function scan_route_file(file)
    local fh = io.open(file)
    local data = fh:read("*all")
    fh:close()

    local func = load(data, file)

    local matches = ngx.re.gmatch(data, "^-- ROUTE:([A-Za-z,]+):([^\\s]+)\\s*$", "m")
    for m in matches do
        local methods = explode(",", m[1])
        for _, method in pairs(methods) do
            add_route(m[2], method, file, func)
        end
    end
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

    for i, seg in pairs(urlsplit) do
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
    for i, mapping in pairs(handler.mappings) do
        ngx.ctx.route_vars[mapping] = urlsplit[i]
    end

    ngx.header["FoxCaves-Route-URL"] = url
    ngx.header["FoxCaves-Route-Method"] = method
    ngx.header["FoxCaves-Route-ID"] = handler.id

    handler.func()
end

scan_route_dir(MAIN_DIR .. "routes")
