local utils = require("foxcaves.utils")
local Link = require("foxcaves.models.link")
local ngx = ngx

register_route("/cdn/link/{id}", "GET", make_route_opts_anon(), function()
    local link = Link.GetByID(ngx.ctx.route_vars.id)

    ngx.header["Content-Type"] = "text/plain"

    if not link then
        return utils.api_error("Link not found", 404)
    end

    ngx.status = 302
    ngx.redirect(link.url)
end)
