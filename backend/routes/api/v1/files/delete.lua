local utils = require("utils")

register_route("/api/v1/files/{id}", "DELETE", make_route_opts(), function()
	local file = File.GetByID(ngx.ctx.route_vars.id)
	if not file then
		return utils.api_error("Not found", 404)
	end
	if file.user ~= ngx.ctx.user.id then
		return utils.api_error("Not your file", 403)
	end
	file:Delete()
	return file
end)
