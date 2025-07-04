local env = require('foxcaves.env')
local revision = require('foxcaves.revision')
local enable_sentry = not not require('foxcaves.config').sentry.dsn
local utils = require('foxcaves.utils')
local ngx = ngx

R.register_route('/api/v1/system/info', 'GET', R.make_route_opts_anon(), function()
    return {
        environment = env,
        release = revision.hash,
        sentry = enable_sentry,
    }
end)
