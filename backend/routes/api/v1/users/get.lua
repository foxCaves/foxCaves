-- ROUTE:GET:/api/v1/users/{id}
dofile(ngx.var.main_root .. "/scripts/global.lua")
dofile("scripts/api_login.lua")
if not ngx.ctx.user then return end

local database = ngx.ctx.database

ngx.header["Content-Type"] = "application/json"
local id = tonumber(ngx.ctx.route_vars.id)

local user = database:hmget(database.KEYS.USERS .. id, "username")
if (not user) or (user == ngx.null) or (not user.username) or (user.username == ngx.null) then
    ngx.exit(404)
    return
end
user.id = id
ngx.print(cjson.encode(user))
ngx.eof()
