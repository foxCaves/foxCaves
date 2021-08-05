ctx_init()

local linkid = ngx.var.linkid
local database = ngx.ctx.database
local dest = database:query_safe('SELECT url FROM links WHERE id = %s', linkid)
dest = dest[1]

ngx.header["Content-Type"] = "text/plain"

if not dest then
    ngx.status = 404
    return
end

__on_shutdown()
ngx.status = 302
ngx.redirect(dest.url)
