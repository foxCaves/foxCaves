local utils = require("foxcaves.utils")
local WS_URL = ngx.re.gsub(require("foxcaves.config").urls.main, "^http", "ws", "o")

local ngx = ngx

R.register_route("/api/v1/files/{id}/livedraw", "GET", R.make_route_opts({ allow_guest = true }), function(route_vars)
    local id = route_vars.id
    local session = ngx.var.arg_session

    if not id or not session then
        return utils.api_error("Missing id or session", 400)
    end

    return {
        url = WS_URL .. "/api/v1/ws/livedraw?id=" .. id .. "&session=" .. session
    }
end)
