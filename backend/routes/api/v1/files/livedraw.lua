-- ROUTE:GET:/api/v1/files/{id}/livedraw
ALLOW_GUEST = true
dofile_global()
dofile("scripts/api_login.lua")

local WS_URL = ngx.re.gsub(MAIN_URL, "^http", "ws", "o")

local id = ngx.ctx.route_vars.id
local session = ngx.var.arg_session

if not id or not session then
    ngx.status = 400
    return
end

ngx.print(cjson.encode({
    url = WS_URL .. "/api/v1/ws/livedraw?id=" .. id .. "&session=" .. session
}))
