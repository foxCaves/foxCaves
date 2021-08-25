local utils = require("foxcaves.utils")
local file_model = require("foxcaves.models.file")
local ngx = ngx

R.register_route("/cdn/sendfile/f/{file}", "GET", R.make_route_opts_anon(), function(route_vars)
    local id, ext = file_model.extract_name_and_extension(route_vars.file)

    local file = file_model.get_by_id(id)

    if (not file) or file.extension:lower() ~= ext:lower() then
        return utils.api_error("File not found", 404)
    end

    local disposition_type = "inline"
    if ngx.var.arg_dl then
        disposition_type = "attachment"
    end

    ngx.header["Content-Disposition"] = disposition_type .. "; filename=\"" .. file.name .. "\""

    ngx.req.set_uri("/rawget/" .. file.id .. "/file." .. file.extension, true)
end)
