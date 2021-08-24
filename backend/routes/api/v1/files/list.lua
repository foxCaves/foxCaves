local file_model = require("foxcaves.models.file")
local ngx = ngx
local next = next

R.register_route("/api/v1/files", "GET", R.make_route_opts({ empty_is_array = true }), function()
    local res = file_model.get_by_user(ngx.ctx.user)
    for k, v in next, res do
        res[k] = v:get_public()
    end
    return res
end)
