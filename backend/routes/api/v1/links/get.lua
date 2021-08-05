-- ROUTE:GET:/api/v1/links/{id}
dofile(ngx.var.main_root .. "/scripts/global.lua")
dofile("scripts/api_login.lua")
if not ngx.ctx.user then return end

dofile("scripts/linkapi.lua")
local link = link_get(ngx.ctx.route_vars.id)
if not link then
    ngx.status = 404
    return
end
ngx.print(cjson.encode(link))
