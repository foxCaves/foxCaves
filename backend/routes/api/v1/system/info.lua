local env = require("foxcaves.env")
local revision = require("foxcaves.revision")
local enable_sentry = not not require("foxcaves.config").sentry.dsn
local enable_test_error = not not require("foxcaves.config").app.enable_test_error
local error = error

R.register_route("/api/v1/system/info", "GET", R.make_route_opts_anon(), function()
    return {
        environment = env,
        release = revision.hash,
        sentry = enable_sentry,
    }
end)

if enable_test_error then
    R.register_route("/api/v1/system/error", "GET", R.make_route_opts_anon(), function()
        error("test error")
    end)
end
