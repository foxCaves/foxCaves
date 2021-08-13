local utils = require("foxcaves.utils")
local Link = require("foxcaves.models.link")
local ngx = ngx

R.register_route("/api/v1/links", "POST", R.make_route_opts(), function()
	local link = Link.New()
	link:SetOwner(ngx.ctx.user)

	if not link:SetURL(ngx.unescape_uri(ngx.var.arg_url)) then
		return utils.api_error("Invalid URL")
	end

	link:Save()

	return link
end)
