-- ROUTE:GET:/api/v1/users/{id}
dofile(ngx.var.main_root .. "/scripts/global.lua")
dofile("scripts/api_login.lua")
if not ngx.ctx.user then return end

local database = ngx.ctx.database

local id = ngx.ctx.route_vars.id
if id == "@me" then
    local user = ngx.ctx.user
    user.password = nil
    ngx.print(cjson.encode(user))
    ngx.eof()
    return
end

id = tonumber(id)
local user =database:hmget(database.KEYS.USERS .. id, "username")
ngx.print(cjson.encode(user))
ngx.eof()
