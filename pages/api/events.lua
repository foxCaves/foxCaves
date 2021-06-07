dofile(ngx.var.main_root .. "/scripts/global.lua")
dofile("scripts/api_login.lua")
if not ngx.ctx.user then return end

local database = ngx.ctx.database

local server = require("resty.websocket.server")
local ws, err = server:new({
    timeout = 5000,
    max_payload_len = 65535,
})
if not ws then
    ngx.exit(400)
    return
end

local res, err = database:subscribe(database.KEYS.PUSH .. ngx.var.args)
if err then
    ws:send_close()
    ngx.eof()
    return
end

local function websocket_read()
    while true do
        local data, typ, err = ws:recv_frame()
        if ws.fatal or typ == "close" or typ == "error" then
            ws:send_close()
            ngx.eof()
            return
        end
        if typ == "ping" then
            ws:send_pong(data)
        end
    end
end

local function redis_read()
    while true do
        local res, err = database:read_reply()
        if err and err ~= "timeout" then
            ws:send_close()
            ngx.eof()
            return
        end
        if res then
            ws:send_text(res[3])
        end
    end
end

local redis_thread = ngx.thread.spawn(redis_read)
websocket_read()
ngx.eof()
ngx.thread.wait(redis_thread)
