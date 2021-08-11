register_route("/api/v1/links", "POST", make_route_opts(), function()
	local link = Link.New()
	link:SetOwner(ngx.ctx.user)

	if not link:SetURL(ngx.unescape_uri(ngx.var.arg_url)) then
		return api_error("Invalid URL")
	end

	link:Save()

	return link
end)
