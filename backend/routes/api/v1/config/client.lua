local revision = require("foxcaves.revision")
local cjson = require("cjson")
local config = require("foxcaves.config")

local ngx = ngx

local function get_config()
    return {
        sentry_dsn = config.sentry.dsn_frontend,
        backend_release = revision.hash,
        frontend_release = ngx.unescape_uri(ngx.var.arg_frontend_release or "UNKNOWN"),
        main_url = config.urls.main,
        short_url = config.urls.short,
    }
end

R.register_route("/api/v1/config/client", "GET", R.make_route_opts_anon(), function()
    return get_config()
end)
R.register_route("/api/v1/config/client.js", "GET", R.make_route_opts_anon(), function()
    ngx.header["Content-Type"] = "text/javascript"
    ngx.print("window.CONFIG = " .. cjson.encode(get_config()) .. ";")
end)
