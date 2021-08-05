-- ROUTE:GET:/api/v1/files/{id}
ctx_init()

local file = file_get_public(ngx.ctx.route_vars.id)
if not file then
    ngx.status = 404
    return
end

ngx.print(cjson.encode(file))
