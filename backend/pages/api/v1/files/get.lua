-- ROUTE:GET:/api/v1/files/{id}
dofile(ngx.var.main_root .. "/scripts/global.lua")
dofile("scripts/api_login.lua")
if not ngx.ctx.user then return end

dofile("scripts/fileapi.lua")
ngx.header["Content-Type"] = "application/json"
ngx.print(cjson.encode(file_get(ngx.ctx.route_vars.id)))
ngx.eof()
