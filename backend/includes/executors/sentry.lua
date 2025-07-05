local router = require('foxcaves.router')
local env = require('foxcaves.env')
local revision = require('foxcaves.revision')
local sentry_config = require('foxcaves.config').sentry
local raven = require('raven')
local raven_sender = require('raven.senders.ngx')
local ngx = ngx

local rvn = raven.new({
    sender = raven_sender.new({ dsn = sentry_config.dsn }),
    environment = env.name,
    release = revision.hash,
})

return function()
    local isok, err = rvn:call_ext(
        {
            user = ngx.ctx.user and ngx.ctx.user:get_public(),
            tags = {
                ip = ngx.var.remote_addr,
                url = ngx.var.request_uri,
            },
        },
        router.execute
    )
    return isok, err, nil
end
