-- ROUTE:GET:/api/livedraw
-- ROUTE:GET:/api/v1/files/{id}/livedraw
ALLOW_GUEST = true
dofile(ngx.var.main_root .. "/scripts/global.lua")
dofile("scripts/api_login.lua")

local WS_URL = ngx.re.gsub(MAIN_URL, "^http", "ws", "o")

local id = ngx.ctx.route_vars.id or ngx.var.arg_id
local session = ngx.var.arg_session

if not id or not session then
    ngx.exit(400)
    return
end

ngx.header["Content-Type"] = "application/json"
ngx.print(cjson.encode({
    url = WS_URL .. "/api/v1/ws/livedraw?id=" .. id .. "&session=" .. session
}))
