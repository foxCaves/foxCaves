register_route("/api/v1/users/{id}", "GET", make_route_opts_anon(), function()
    local userres = get_ctx_database():query_safe('SELECT id, username FROM users WHERE id = %s', ngx.ctx.route_vars.id)
    local user = userres[1]
    if not user then
        ngx.status = 404
        return
    end
    ngx.print(cjson.encode(user))
end)
