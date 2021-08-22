local utils = require("foxcaves.utils")
local file_model = require("foxcaves.models.file")

R.register_route("/api/v1/files/{id}", "GET", R.make_route_opts_anon(), function(route_vars)
    local file = file_model.get_by_id(route_vars.id)
    if not file then
        return utils.api_error("File not found", 404)
    end
    return file
end)
