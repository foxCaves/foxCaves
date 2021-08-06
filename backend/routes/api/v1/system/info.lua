register_route("/api/v1/system/info", "GET", make_route_opts_anon(), function()
    ngx.print(cjson.encode({
        environment = ENVIRONMENT,
        release = REVISION,
    }))
end)
