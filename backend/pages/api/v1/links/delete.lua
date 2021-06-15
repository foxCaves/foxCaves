-- ROUTE:DELETE:/api/links/{id}
-- ROUTE:GET:/api/v1/links/{id}/delete
dofile(ngx.var.main_root .. "/scripts/global.lua")
dofile("scripts/api_login.lua")
if not ngx.ctx.user then return end

local database = ngx.ctx.database

local id = ngx.ctx.route_vars.id
local res = database:zrem(database.KEYS.USER_LINKS .. ngx.ctx.user.id, id)

local ok = res and res ~= ngx.null and res ~= 0
if ok then
    database:del(database.KEYS.LINKS .. id)
end

if ngx.var.arg_redirect then
    ngx.redirect("/mylinks?delete_ok=" .. tostring(ok))
    ngx.eof()
    return
end

if not ok then
    ngx.status = 400
end

raw_push_action({
    type = "link:delete",
    id = id,
})
ngx.eof()
