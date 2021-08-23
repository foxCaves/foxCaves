local utils = require("foxcaves.utils")
local file_model = require("foxcaves.models.file")
local ngx = ngx

R.register_route("/cdn/sendfile/{action}/{id}/{extension}", "GET", R.make_route_opts_anon(), function(route_vars)
    local file = file_model.get_by_id(route_vars.id)

    if (not file) or file.extension:lower() ~= route_vars.extension:lower() then
        return utils.api_error("File not found", 404)
    end

    local disposition_type = "attachment"
    if route_vars.action == "f" then
        disposition_type = "inline"
    end

    ngx.header["Content-Disposition"] = disposition_type .. "; filename=\"" .. file.name .. "\""

    ngx.req.set_uri("/rawget/" .. file.id .. "/file." .. file.extension, true)
end)
