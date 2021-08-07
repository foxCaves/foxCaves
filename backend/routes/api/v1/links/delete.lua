register_route("/api/v1/links/{id}", "DELETE", make_route_opts(), function()
    local link = link_get(ngx.ctx.route_vars.id, ngx.ctx.user.id)
    if not link then
        return api_error("Could not delete link", 400) 
    end
    
    get_ctx_database():query_safe('DELETE FROM links WHERE id = %s', link.id)

    raw_push_action({
        action = "link:delete",
        link = link,
    })
end)
