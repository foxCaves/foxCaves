local Link = require("foxcaves.models.link")

register_route("/api/v1/links", "GET", make_route_opts({ empty_is_array = true }), function()
	return Link.GetByUser(ngx.ctx.user)
end)
