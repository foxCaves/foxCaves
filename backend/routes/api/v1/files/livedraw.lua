local utils = require('utils')

register_route("/api/v1/files/{id}/livedraw", "GET", make_route_opts({ allow_guest = true }), function()
    local WS_URL = ngx.re.gsub(CONFIG.urls.main, "^http", "ws", "o")

    local id = ngx.ctx.route_vars.id
    local session = ngx.var.arg_session

    if not id or not session then
        return utils.api_error("Missing id or session", 400)
    end

    return {
        url = WS_URL .. "/api/v1/ws/livedraw?id=" .. id .. "&session=" .. session
    }
end)
