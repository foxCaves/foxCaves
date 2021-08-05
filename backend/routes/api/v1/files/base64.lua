-- ROUTE:GET:/api/v1/files/{id}/base64
api_ctx_init()
if not ngx.ctx.user then return end

local succ, data = file_download(ngx.ctx.route_vars.id, ngx.ctx.user.id)
if(not succ) then
	ngx.status = 403
	ngx.print("failed")
	return
end
ngx.print(ngx.encode_base64(data))
