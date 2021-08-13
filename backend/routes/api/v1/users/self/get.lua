local ngx = ngx

R.register_route("/api/v1/users/self", "GET", R.make_route_opts(), function()
    return ngx.ctx.user:GetPublic()
end)

R.register_route("/api/v1/users/self/details", "GET", R.make_route_opts(), function()
    return ngx.ctx.user:GetPrivate()
end)
