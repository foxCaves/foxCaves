dofile(ngx.var.main_root .. "/scripts/global.lua")

local linkid = ngx.var.linkid
local database = ngx.ctx.database
local dest = database:query_safe('SELECT url FROM links WHERE id = %s', linkid)
if not dest[1] then
    ngx.status = 404
    return
end

ngx.status = 302
ngx.redirect(dest[1].url)
