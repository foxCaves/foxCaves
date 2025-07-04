local utils = require('foxcaves.utils')
local router = require('foxcaves.router')
local env = require('foxcaves.env')
local revision = require('foxcaves.revision')
local sentry_config = require('foxcaves.config').sentry
local ngx = ngx

local raven = require('raven')
local raven_sender = require('raven.senders.ngx')

local M = {}
require('foxcaves.module_helper').setmodenv()

local rvn

if sentry_config.dsn then
    rvn = raven.new({
        sender = raven_sender.new({ dsn = sentry_config.dsn }),
        environment = env.name,
        release = revision.hash,
    })
else
    ngx.log(ngx.WARN, 'Sentry is not configured, using no-op Raven instance')
    rvn = {}
    function rvn.call_ext(_, _, func)
        return pcall(func)
    end
end

function M.run()
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
    ngx.req.discard_body()
    if not isok then
        ngx.status = 500
        ngx.header['Cache-Control'] = 'no-cache, no-store'
        ngx.log(ngx.ERR, 'Lua error: ' .. err)
    end
    utils.__on_shutdown()
    ngx.eof()
end

return M
