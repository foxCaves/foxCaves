-- ROUTE:POST:/api/v1/users/@me/logout
dofile(ngx.var.main_root .. "/scripts/global.lua")

ngx.ctx.logout()
