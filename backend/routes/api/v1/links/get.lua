local utils = require("foxcaves.utils")
local Link = require("foxcaves.models.link")
local ngx = ngx

R.register_route("/api/v1/links/{id}", "GET", R.make_route_opts_anon(), function()
    local link = Link.GetByID(ngx.ctx.route_vars.id)
    if not link then
        return utils.api_error("Link not found", 404)
    end
    return link
end)
