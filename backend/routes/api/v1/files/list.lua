register_route("/api/v1/files", "GET", make_route_opts(), function()
	local files = get_ctx_database():query_safe('SELECT * FROM files WHERE "user" = %s', ngx.ctx.user.id)

	local results = {}
	for _, file in next, files do
		table.insert(results, file_get_public(file))
	end

	return results
end)
