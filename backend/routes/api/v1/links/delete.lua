-- ROUTE:DELETE:/api/v1/links/{id}
dofile(ngx.var.main_root .. "/scripts/global.lua")
dofile("scripts/api_login.lua")
if not ngx.ctx.user then return end

local database = ngx.ctx.database
local id = ngx.ctx.route_vars.id

local res = database:query_safe('DELETE FROM links WHERE id = %s AND "user" = %s', id, ngx.ctx.user.id)

if res.affected_rows > 0 then
    raw_push_action({
        action = "link:delete",
        link = linkinfo,
    })
else
    ngx.status = 400
end
ngx.eof()
