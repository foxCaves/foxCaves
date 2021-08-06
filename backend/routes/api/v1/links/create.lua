register_route("/api/v1/links", "POST", make_route_opts(), function()
	local linkid = randstr(10)

	local url = ngx.unescape_uri(ngx.var.arg_url)
	local short_url = link_shorturl(linkid)

	get_ctx_database():query_safe('INSERT INTO links (id, "user", url, time) VALUES (%s, %s, %s, %s)', linkid, ngx.ctx.user.id, url, ngx.time())

	local linkinfo = {
		id = linkid,
		url = url,
		short_url = short_url,
	}

	raw_push_action({
		action = "link:create",
		link = linkinfo,
	})
	ngx.print(cjson.encode(linkinfo))
end)
