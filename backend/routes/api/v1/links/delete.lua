register_route("/api/v1/links/{id}", "DELETE", make_route_opts(), function()
	local link = Link.GetByID(ngx.ctx.route_vars.id)
	if not link then
		return api_error("Not found", 404)
	end
	if link.user ~= ngx.ctx.user.id then
		return api_error("Not your link", 403)
	end
	link:Delete()
	return link
end)
