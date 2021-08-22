local utils = require("foxcaves.utils")
local link_model = require("foxcaves.models.link")
local ngx = ngx

R.register_route("/api/v1/links/{id}", "DELETE", R.make_route_opts(), function(route_vars)
	local link = link_model.get_by_id(route_vars.id)
	if not link then
		return utils.api_error("Link not found", 404)
	end
	if link.user ~= ngx.ctx.user.id then
		return utils.api_error("Not your link", 403)
	end
	link:delete()
	return link
end)
