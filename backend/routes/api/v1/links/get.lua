-- ROUTE:GET:/api/v1/links/{id}
api_ctx_init()
if not ngx.ctx.user then return end

local link = link_get(ngx.ctx.route_vars.id)
if not link then
    ngx.status = 404
    return
end
ngx.print(cjson.encode(link))
