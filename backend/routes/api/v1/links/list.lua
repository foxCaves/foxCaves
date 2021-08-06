register_route("/api/v1/links", "GET", make_route_opts(), function()
	local links = get_ctx_database():query_safe('SELECT * FROM links WHERE "user" = %s', ngx.ctx.user.id)

	local results = {}
	for _, link in next, links do
		table.insert(results, link_get(link))
	end
	ngx.print(cjson.encode(results))
end)
