local function get_config()
    return {
        sentry_dsn = SENTRY_DSN_CLIENT,
        backend_release = REVISION,
        main_url = MAIN_URL,
        short_url = SHORT_URL,
    }
end

register_route("/api/v1/config/client", "GET", make_route_opts_anon(), function()
    return get_config()
end)
register_route("/api/v1/config/client.js", "GET", make_route_opts_anon(), function()
    ngx.header["Content-Type"] = "text/javascript"
    ngx.print("window.CONFIG = " .. cjson.encode(get_config()) .. ";")
end)
