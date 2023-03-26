local enable_test_error = not not require("foxcaves.config").app.enable_test_error
local error = error

if enable_test_error then
    R.register_route("/api/v1/system/error", "GET", R.make_route_opts_anon(), function()
        error("test error")
    end)
end
