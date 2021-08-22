local utils = require("foxcaves.utils")
local user_model = require("foxcaves.models.user")
local link_model = require("foxcaves.models.link")
local file_model = require("foxcaves.models.file")
local ngx = ngx
local next = next

R.register_route("/api/v1/users/{id}", "DELETE", R.make_route_opts(), function(route_vars)
    local user = user_model.get_by_id(route_vars.id)
    if not user then
        return utils.api_error("User not found", 404)
    end
    if user.id ~= ngx.ctx.user.id then
        return utils.api_error("You are not allowed to delete this user", 403)
    end

    local args = utils.get_post_args()

    if not user:check_password(args.current_password) then
        return utils.api_error("current_password invalid", 403)
    end

    local links = link_model.get_by_user(user)
    local files = file_model.get_by_user(user)
    for _, link in next, links do
        link:delete()
    end
    for _, file in next, files do
        file:delete()
    end
    user:delete()
end)
