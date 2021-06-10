ALLOW_GUEST = true
dofile(ngx.var.main_root .. "/scripts/global.lua")
dofile("scripts/api_login.lua")

local WS_URL = ngx.re.gsub(MAIN_URL, "^http", "ws", "o")

ngx.print(cjson.encode({
    url = WS_URL .. "/api/livedraw_ws"
}))
