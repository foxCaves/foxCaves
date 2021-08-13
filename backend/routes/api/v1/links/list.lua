local Link = require("foxcaves.models.link")
local ngx = ngx

R.register_route("/api/v1/links", "GET", R.make_route_opts({ empty_is_array = true }), function()
	return Link.GetByUser(ngx.ctx.user)
end)
