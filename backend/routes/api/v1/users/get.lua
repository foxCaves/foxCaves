-- ROUTE:GET:/api/v1/users/{id}
ctx_init()

local database = ngx.ctx.database

local userres = database:query_safe('SELECT id, username FROM users WHERE id = %s', ngx.ctx.route_vars.id)
local user = userres[1]
if not user then
    ngx.status = 404
    return
end
ngx.print(cjson.encode(user))
