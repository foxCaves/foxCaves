dofile(ngx.var.main_root .. "/scripts/global.lua")

local linkid = ngx.var.linkid
local database = ngx.ctx.database
local dest = database:get(database.KEYS.LINKS .. linkid)
if not dest then
    ngx.exit(404)
end

ngx.status = 302
ngx.redirect(dest)
