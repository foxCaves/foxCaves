register_route("/api/v1/files/{id}/base64", "GET", make_route_opts(), function()
	local ok, data = file_download(ngx.ctx.route_vars.id, ngx.ctx.user.id)
	if not ok then
		ngx.status = 403
		ngx.print("failed")
		return
	end
	ngx.print(ngx.encode_base64(data))
end)
