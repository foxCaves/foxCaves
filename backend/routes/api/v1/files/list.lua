local file_model = require("foxcaves.models.file")
local ngx = ngx

R.register_route("/api/v1/files", "GET", R.make_route_opts({ empty_is_array = true }), function()
    return file_model.get_by_user(ngx.ctx.user)
end)
