local CONFIG = CONFIG
local ENVIRONMENT = ENVIRONMENT
local ENVIRONMENT_STRING = ENVIRONMENT_STRING
local REVISION = REVISION

register_route("/api/v1/system/info", "GET", make_route_opts_anon(), function()
    return {
        environment = {
            id = ENVIRONMENT,
            name = ENVIRONMENT_STRING,
        },
        release = REVISION,
        sentry = not not CONFIG.sentry.dsn,
    }
end)
