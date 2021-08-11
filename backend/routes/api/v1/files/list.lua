local File = require("foxcaves.models.file")

register_route("/api/v1/files", "GET", make_route_opts({ empty_is_array = true }), function()
	return File.GetByUser(ngx.ctx.user)
end)
