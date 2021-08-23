local link_model = require("foxcaves.models.link")
local ngx = ngx

R.register_route("/api/v1/links", "GET", R.make_route_opts({ empty_is_array = true }), function()
    return link_model.get_by_user(ngx.ctx.user)
end)
