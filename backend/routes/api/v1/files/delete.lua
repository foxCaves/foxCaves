register_route("/api/v1/files/{id}", "DELETE", make_route_opts(), function()
	local ok, _ = file_delete(ngx.ctx.route_vars.id, ngx.ctx.user.id)
	if not ok then
		ngx.status = 400
	end
end)
