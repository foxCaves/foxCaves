local utils = require("foxcaves.utils")
local File = require("foxcaves.models.file")
local ngx = ngx

register_route("/cdn/sendfile/{action}/{fileid}/{extension}", "GET", make_route_opts_anon(), function()
	local function send_file(disposition_type)
		local file = File.GetByID(ngx.ctx.route_vars.fileid)

		if (not file) or file.extension:sub(2):lower() ~= ngx.ctx.route_vars.extension:lower() then
			return utils.api_error("File not found", 404)
		end

		ngx.header["Content-Dispotition"] = disposition_type .. "; filename=" .. file.name

		ngx.req.set_uri("/rawget/" .. file.id .. "/file" .. file.extension, true)
	end

	if ngx.ctx.route_vars.action == "f" then
		send_file("inline")
	else
		ngx.header["Content-Type"] = "application/octet-stream"
		send_file("attachment")
	end
end)
