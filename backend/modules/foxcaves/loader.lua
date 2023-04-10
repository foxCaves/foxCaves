local sentry_config = require('foxcaves.config').sentry

if sentry_config.dsn then
    return require('foxcaves.loader_sentry')
else
    return require('foxcaves.loader_debug')
end
