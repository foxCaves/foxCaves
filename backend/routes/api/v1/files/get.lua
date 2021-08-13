local utils = require("foxcaves.utils")
local File = require("foxcaves.models.file")

R.register_route("/api/v1/files/{id}", "GET", R.make_route_opts_anon(), function(route_vars)
    local file = File.GetByID(route_vars.id)
    if not file then
        return utils.api_error("file not found", 404)
    end
    return file
end)
