-- ROUTE:POST:/api/v1/users/self/logout
dofile(ngx.var.main_root .. "/scripts/global.lua")

ngx.ctx.logout()
