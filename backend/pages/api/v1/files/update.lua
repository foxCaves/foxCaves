-- ROUTE:PATCH:/api/v1/files/{id}
dofile(ngx.var.main_root .. "/scripts/global.lua")
dofile("scripts/api_login.lua")
if not ngx.ctx.user then return end

local database = ngx.ctx.database

dofile("scripts/fileapi.lua")
local file = file_get(ngx.ctx.route_vars.id, ngx.ctx.user.id)
if not file then
    ngx.exit(404)
    return
end

local newname = ngx.unescape_uri(ngx.var.arg_name)

if newname:sub((newname:len() + 1) - file.extension:len()) ~= file.extension then
    api_error("Extension mismatch")
    return
end

file.name = newname

database:hset(database.KEYS.FILES .. file.id, "name", newname)

file_push_action('refresh', {
	id = file.id,
	name = newname,
})

ngx.header["Content-Type"] = "application/json"
ngx.print(cjson.encode(file))
ngx.eof()
