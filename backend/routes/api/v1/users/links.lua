local link_model = require("foxcaves.models.link")
local user_model = require("foxcaves.models.user")
local utils = require("foxcaves.utils")
local ngx = ngx
local next = next

R.register_route("/api/v1/users/{user}/links", "GET", R.make_route_opts({ empty_is_array = true }), function(route_vars)
    local user = user_model.get_by_id(route_vars.user)
    if not user then
        return utils.api_error("User not found", 404)
    end
    if user.id ~= ngx.ctx.user.id then
        return utils.api_error("You are not list links for this user", 403)
    end

    local res = link_model.get_by_user(user)
    for k, v in next, res do
        res[k] = v:get_public()
    end
    return res
end, {
    description = "Get a list of links of a user",
    authentication = {"self"},
    request = {
        params = {
            user = {
                type = "uuid",
                description = "The id of the user"
            },
        },
    },
    response = {
        body = {
            type = "array",
            items = {
                type = "link.private",
            },
        },
    },
})
