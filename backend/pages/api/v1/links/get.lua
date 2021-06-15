-- ROUTE:GET:/api/v1/files/{id}
dofile(ngx.var.main_root .. "/scripts/global.lua")
dofile("scripts/api_login.lua")
if not ngx.ctx.user then return end

dofile("scripts/linkapi.lua")
ngx.header["Content-Type"] = "application/json"
ngx.print(cjson.encode(link_get(ngx.ctx.route_vars.id)))
ngx.eof()
