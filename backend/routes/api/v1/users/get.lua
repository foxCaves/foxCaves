-- ROUTE:GET:/api/v1/users/{id}
dofile(ngx.var.main_root .. "/scripts/global.lua")
dofile("scripts/api_login.lua")
if not ngx.ctx.user then return end

local database = ngx.ctx.database

local userres = database:query_safe('SELECT id, username FROM users WHERE id = "%s"', ngx.ctx.route_vars.id)
local user = userres[1]
if not user then
    ngx.exit(404)
    return
end
ngx.print(cjson.encode(user))
ngx.eof()
