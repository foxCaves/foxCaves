-- ROUTE:GET:/api/v1/ws/events
api_ctx_init()
if not ngx.ctx.user then return end

local redis = make_redis(true)

local server = require("resty.websocket.server")
local ws, err = server:new({
    timeout = 5000,
    max_payload_len = 65535,
})
if not ws then
    ngx.status = 400
    return
end

local function kick()
    ws:send_close()
    should_run = false
end

local res, err = redis:subscribe("push:" ..  ngx.ctx.user.id)
if err then
    return kick()
end

local should_run = true

local function websocket_read()
    while should_run do
        local data, typ, err = ws:recv_frame()
        if ws.fatal or typ == "close" or typ == "error" then
            return kick()
        end
		if err then
			ws:send_ping()
        elseif typ == "ping" then
            ws:send_pong(data)
        end
    end
    should_run = false
end

local function redis_read()
    while should_run do
        local res, err = redis:read_reply()
        if err and err ~= "timeout" then
            return kick()
        end
        if res then
            res = res[3]
            ws:send_text(res)
            local decode = cjson.decode(res)
            if decode and decode.action == "kick" then
                return kick()
            end
        end
    end
    should_run = false
end

local redis_thread = ngx.thread.spawn(redis_read)
websocket_read()
ngx.thread.wait(redis_thread)
redis:close()
