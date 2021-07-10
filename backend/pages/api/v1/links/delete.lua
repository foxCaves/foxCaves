-- ROUTE:DELETE:/api/v1/links/{id}
dofile(ngx.var.main_root .. "/scripts/global.lua")
dofile("scripts/api_login.lua")
if not ngx.ctx.user then return end

local database = ngx.ctx.database
local id = ngx.ctx.route_vars.id

dofile("scripts/linkapi.lua")
local linkinfo = link_get(id, ngx.ctx.user.id)
local ok = linkinfo ~= nil
if ok then
    database:zrem(database.KEYS.USER_LINKS .. ngx.ctx.user.id, id)
    database:del(database.KEYS.LINKS .. id)
    raw_push_action({
        action = "link:delete",
        link = linkinfo,
    })
end

if not ok then
    ngx.status = 400
end
ngx.eof()
