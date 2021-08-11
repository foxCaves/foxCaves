register_route("/api/v1/files/{id}", "GET", make_route_opts_anon(), function()
    local file = File.GetByID(ngx.ctx.route_vars.id)
    if not file then
        return api_error("file not found", 404)
    end
    return file
end)
