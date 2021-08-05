-- ROUTE:GET:/api/v1/links/{id}
dofile_global()
dofile("scripts/api_login.lua")
if not ngx.ctx.user then return end

dofile("scripts/linkapi.lua")
local link = link_get(ngx.ctx.route_vars.id)
if not link then
    ngx.status = 404
    return
end
ngx.print(cjson.encode(link))
