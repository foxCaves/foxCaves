local env = require("foxcaves.env")
local revision = require("foxcaves.revision")
local CONFIG = CONFIG

register_route("/api/v1/system/info", "GET", make_route_opts_anon(), function()
    return {
        environment = env,
        release = revision.hash,
        sentry = not not CONFIG.sentry.dsn,
    }
end)
