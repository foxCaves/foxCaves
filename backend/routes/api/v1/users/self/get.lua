register_route("/api/v1/users/self", "GET", make_route_opts(), function()
    local user = ngx.ctx.user
    user.password = nil
    user.loginkey = nil
    user.sessionid = nil
    user.salt = nil
    user.usedbytes = user_calculate_usedbytes(user)
    ngx.print(cjson.encode(user))
end)
