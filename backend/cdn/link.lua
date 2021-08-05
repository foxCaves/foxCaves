ctx_init()

local dest = ngx.ctx.database:query_safe('SELECT url FROM links WHERE id = %s', ngx.var.linkid)
dest = dest[1]

ngx.log(ngx.ERR, ngx.var.linkid .. "|" .. cjson.encode(dest))

ngx.header["Content-Type"] = "text/plain"

if not dest then
    ngx.status = 404
    ngx.print("Link not found")
    return
end

__on_shutdown()
ngx.status = 302
ngx.redirect(dest.url)
