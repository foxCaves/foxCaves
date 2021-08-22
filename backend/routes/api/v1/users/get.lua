local utils = require("foxcaves.utils")
local user_model = require("foxcaves.models.user")

R.register_route("/api/v1/users/{id}", "GET", R.make_route_opts_anon(), function(route_vars)
    local user = user_model.get_by_id(route_vars.id)
    if not user then
        return utils.api_error("User not found", 404)
    end
    return user:get_public()
end)
