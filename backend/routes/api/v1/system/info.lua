register_route("/api/v1/system/info", "GET", make_route_opts_anon(), function()
    return {
        environment = ENVIRONMENT,
        release = REVISION,
    }
end)
