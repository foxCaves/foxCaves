local ngx = ngx

register_route("/api/v1/users/self", "GET", make_route_opts(), function()
    return ngx.ctx.user:GetPrivate()
end)
