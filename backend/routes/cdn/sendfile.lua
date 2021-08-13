local utils = require("foxcaves.utils")
local File = require("foxcaves.models.file")
local ngx = ngx

local function send_file(disposition_type, route_vars)
	local file = File.GetByID(route_vars.id)

	if (not file) or file.extension:sub(2):lower() ~= route_vars.extension:lower() then
		return utils.api_error("File not found", 404)
	end

	ngx.header["Content-Dispotition"] = disposition_type .. "; filename=" .. file.name

	ngx.req.set_uri("/rawget/" .. file.id .. "/file" .. file.extension, true)
end

R.register_route("/cdn/sendfile/{action}/{id}/{extension}", "GET", R.make_route_opts_anon(), function(route_vars)
	if route_vars.action == "f" then
		send_file("inline", route_vars)
	else
		ngx.header["Content-Type"] = "application/octet-stream"
		send_file("attachment", route_vars)
	end
end)
