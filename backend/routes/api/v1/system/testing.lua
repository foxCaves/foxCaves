local error = error

if require("foxcaves.config").app.enable_test_error then
    R.register_route("/api/v1/system/error", "GET", R.make_route_opts_anon(), function()
        error("test error")
    end)
end
