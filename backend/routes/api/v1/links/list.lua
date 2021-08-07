register_route("/api/v1/links", "GET", make_route_opts({ empty_is_array = true }), function()
	local links = get_ctx_database():query_safe('SELECT * FROM links WHERE "user" = %s', ngx.ctx.user.id)

	local results = {}
	for _, link in next, links do
		table.insert(results, link_get(link))
	end
	return results
end)
