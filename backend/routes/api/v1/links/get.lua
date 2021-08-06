register_route("/api/v1/links/{id}", "GET", make_route_opts_anon(), function()
    local link = link_get(ngx.ctx.route_vars.id)
    if not link then
        ngx.status = 404
        return
    end
    ngx.print(cjson.encode(link))
end)
