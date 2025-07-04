local sentry_config = require('foxcaves.config').sentry

if sentry_config.dsn then
    return require('foxcaves.loaders.sentry')
else
    return require('foxcaves.loaders.debug')
end
