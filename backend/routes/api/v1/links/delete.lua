-- ROUTE:DELETE:/api/v1/links/{id}
api_ctx_init()
if not ngx.ctx.user then return end

local res = ngx.ctx.database:query_safe('DELETE FROM links WHERE id = %s AND "user" = %s', ngx.ctx.route_vars.id, ngx.ctx.user.id)

if res.affected_rows > 0 then
    raw_push_action({
        action = "link:delete",
        link = linkinfo,
    })
else
    ngx.status = 400
end
