local link_model = require("foxcaves.models.link")
local ngx = ngx
local next = next

R.register_route("/api/v1/links", "GET", R.make_route_opts({ empty_is_array = true }), function()
    local res = link_model.get_by_user(ngx.ctx.user)
    for k, v in next, res do
        res[k] = v:get_public()
    end
    return res
end)
