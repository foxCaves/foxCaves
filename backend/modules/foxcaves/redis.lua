local resty_redis = require('resty.redis')
local hooks = require('foxcaves.hooks')
local config = require('foxcaves.config').redis
local error = error
local ngx = ngx

local M = {}
require('foxcaves.module_helper').setmodenv()

function M.make(close_on_shutdown)
    local redis, err = resty_redis:new()
    if not redis then
        error('Error initializing Redis: ' .. err)
    end
    redis:set_timeout(60000)

    local ok
    ok, err = redis:connect(config.host, config.port)
    if not ok then
        error('Error connecting to Redis: ' .. err)
    end

    if close_on_shutdown then
        hooks.register_ctx('request_end', function()
            if redis == ngx.ctx.__redis then
                ngx.ctx.__redis = nil
            end
            redis:close()
        end)
    else
        hooks.register_ctx('request_end', function()
            if redis == ngx.ctx.__redis then
                ngx.ctx.__redis = nil
            end
            redis:set_keepalive(config.keepalive_timeout or 10000, config.keepalive_count or 10)
        end)
    end

    return redis
end

function M.get_shared()
    local redis = ngx.ctx.__redis
    if redis then
        return redis
    end
    redis = M.make()
    ngx.ctx.__redis = redis
    return redis
end

return M
