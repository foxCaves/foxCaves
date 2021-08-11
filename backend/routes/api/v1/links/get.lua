register_route("/api/v1/links/{id}", "GET", make_route_opts_anon(), function()
    local link = Link.GetByID(ngx.ctx.route_vars.id)
    if not link then
        return api_error("Link not found", 404)
    end
    return link
end)
