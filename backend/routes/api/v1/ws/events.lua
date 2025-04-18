local cjson = require('cjson')
local redis = require('foxcaves.redis')
local utils = require('foxcaves.utils')
local server = require('resty.websocket.server')
local tostring = tostring
local ngx = ngx

R.register_route(
    '/api/v1/ws/events',
    'GET',
    R.make_route_opts({
        disable_set_cookies = true,
        disable_api_key = true,
    }),
    function()
        local redis_inst = redis.make(true)

        local ws, _ = server:new({
            timeout = 5000,
            max_payload_len = 65535,
        })
        if not ws then
            return utils.api_error('WebSocket requests only')
        end

        local should_run = true

        local function kick()
            ws:send_close()
            should_run = false
        end

        redis_inst:set_timeout(5000)
        local _, rerr = redis_inst:subscribe('push:global', 'push:user:' .. ngx.ctx.user.id)
        if rerr then
            kick()
            return
        end

        local function websocket_read()
            while should_run do
                local data, typ, err = ws:recv_frame()
                if ws.fatal or typ == 'close' or typ == 'error' then
                    ngx.log(ngx.ERR, 'WS ' .. tostring(typ) .. ' error: ' .. tostring(err))
                    return kick()
                end
                if err then
                    ws:send_ping()
                elseif typ == 'ping' then
                    ws:send_pong(data)
                end
            end
            should_run = false
        end

        local function redis_read()
            while should_run do
                local res, err = redis_inst:read_reply()
                if err and err ~= 'timeout' then
                    ngx.log(ngx.ERR, 'Redis error: ' .. tostring(err))
                    return kick()
                end
                if res then
                    res = res[3]
                    ws:send_text(res)
                    local decode = cjson.decode(res)
                    if decode and decode.type == 'kick' then
                        return kick()
                    end
                end
            end
            should_run = false
        end

        local redis_thread = ngx.thread.spawn(redis_read)
        websocket_read()
        ngx.thread.wait(redis_thread)
    end
)
