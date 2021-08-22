local utils = require("foxcaves.utils")
local link_model = require("foxcaves.models.link")
local ngx = ngx

R.register_route("/cdn/link/{id}", "GET", R.make_route_opts_anon(), function(route_vars)
    local link = link_model.get_by_id(route_vars.id)

    ngx.header["Content-Type"] = "text/plain"

    if not link then
        return utils.api_error("link_model not found", 404)
    end

    ngx.status = 302
    ngx.redirect(link.url)
end)
