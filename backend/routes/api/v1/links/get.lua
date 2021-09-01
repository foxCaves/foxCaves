local utils = require("foxcaves.utils")
local link_model = require("foxcaves.models.link")

R.register_route("/api/v1/links/{id}", "GET", R.make_route_opts_anon(), function(route_vars)
    local link = link_model.get_by_id(route_vars.id)
    if not link then
        return utils.api_error("Link not found", 404)
    end
    return link:get_public()
end, {
    description = "Get information about a link",
    request = {
        params = {
            id = {
                type = "string",
                description = "The id of the link"
            },
        },
    },
    response = {
        body = {
            contentType = "json",
            type = "link",
            level = "public",
        },
    },
})
