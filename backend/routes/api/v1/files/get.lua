-- ROUTE:GET:/api/v1/files/{id}
dofile(ngx.var.main_root .. "/scripts/global.lua")
dofile("scripts/api_login.lua")
if not ngx.ctx.user then return end

dofile("scripts/fileapi.lua")
local file = file_get(ngx.ctx.route_vars.id)
if not file then
    ngx.exit(404)
    return
end

ngx.print(cjson.encode(file))
