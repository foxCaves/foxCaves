local utils = require("foxcaves.utils")
local User = require("foxcaves.models.user")

R.register_route("/api/v1/users/{id}", "GET", R.make_route_opts_anon(), function(route_vars)
    local user = User.GetByID(route_vars.id)
    if not user then
        return utils.api_error("User not found", 404)
    end
    return user:GetPublic()
end)
