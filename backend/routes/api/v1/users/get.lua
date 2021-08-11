local utils = require("utils")

register_route("/api/v1/users/{id}", "GET", make_route_opts_anon(), function()
    local user = User.GetByID(ngx.ctx.route_vars.id)
    if not user then
        return utils.api_error("User not found", 404)
    end
    return user:GetPublic()
end)
