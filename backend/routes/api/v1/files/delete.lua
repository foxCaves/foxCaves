-- ROUTE:DELETE:/api/v1/files/{id}
api_ctx_init()
if not ngx.ctx.user then return end

local ok, _ = file_delete(ngx.ctx.route_vars.id, ngx.ctx.user.id)
if not ok then
	ngx.status = 400
end
