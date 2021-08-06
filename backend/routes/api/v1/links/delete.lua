register_route("/api/v1/links/{id}", "DELETE", make_route_opts(), function()
    local res = get_ctx_database():query_safe('DELETE FROM links WHERE id = %s AND "user" = %s', ngx.ctx.route_vars.id, ngx.ctx.user.id)

    if res.affected_rows > 0 then
        raw_push_action({
            action = "link:delete",
            link = linkinfo,
        })
    else
        return api_error("Could not delete link", 400)
    end
end)
