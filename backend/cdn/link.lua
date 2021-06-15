dofile(ngx.var.main_root .. "/scripts/global.lua")

local linkid = ngx.var.linkid
local database = ngx.ctx.database
local dest = database:hget(database.KEYS.LINKS .. linkid, "url")
if (not dest) or (dest == ngx.null) then
    ngx.exit(404)
    return
end

ngx.status = 302
ngx.redirect(dest)
