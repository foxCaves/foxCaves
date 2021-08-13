local utils = require("foxcaves.utils")
local Link = require("foxcaves.models.link")

R.register_route("/api/v1/links/{id}", "GET", R.make_route_opts_anon(), function(route_vars)
    local link = Link.GetByID(route_vars.id)
    if not link then
        return utils.api_error("Link not found", 404)
    end
    return link
end)
