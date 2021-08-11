local revision = require("foxcaves.revision")
local cjson = require("cjson")
local CONFIG = CONFIG
local ngx = ngx

local function get_config()
    return {
        sentry_dsn = CONFIG.sentry.dsn_frontend,
        backend_release = revision.hash,
        frontend_release = ngx.unescape_uri(ngx.var.arg_frontend_release or "UNKNOWN"),
        main_url = CONFIG.urls.main,
        short_url = CONFIG.urls.short,
    }
end

register_route("/api/v1/config/client", "GET", make_route_opts_anon(), function()
    return get_config()
end)
register_route("/api/v1/config/client.js", "GET", make_route_opts_anon(), function()
    ngx.header["Content-Type"] = "text/javascript"
    ngx.print("window.CONFIG = " .. cjson.encode(get_config()) .. ";")
end)
