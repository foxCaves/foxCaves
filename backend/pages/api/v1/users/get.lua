-- ROUTE:GET:/api/v1/users/{id}
dofile(ngx.var.main_root .. "/scripts/global.lua")
dofile("scripts/api_login.lua")
if not ngx.ctx.user then return end

local database = ngx.ctx.database

ngx.header["Content-Type"] = "application/json"
local id = ngx.ctx.route_vars.id
if id == "@me" then
    local user = ngx.ctx.user
    user.password = nil
    ngx.print(cjson.encode(user))
    ngx.eof()
    return
end

id = tonumber(id)
local user = database:hmget(database.KEYS.USERS .. id, "username")
if not user then
    ngx.exit(404)
    return
end
ngx.print(cjson.encode(user))
ngx.eof()
