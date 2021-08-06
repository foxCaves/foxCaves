-- ROUTE:GET:/cdn/link/{linkid}
ctx_init()

local dest = get_ctx_database():query_safe('SELECT url FROM links WHERE id = %s', ngx.ctx.route_vars.linkid)
dest = dest[1]

ngx.header["Content-Type"] = "text/plain"

if not dest then
    ngx.status = 404
    ngx.print("Link not found")
    return
end

ngx.status = 302
ngx.redirect(dest.url)
