-- ROUTE:PUT:/api/v1/files/{id}
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

if newname:sub(newname:len() - file.extension:len()) ~= file.extension then
    ngx.status = 400
    ngx.print("Extension mismatch. Cannot change extension in rename")
    ngx.eof()
    return
end

file.name = newname

database:hset(database.KEYS.FILES .. file.id, "name", newname)

file_push_action('refresh', {
	id = fileid,
	name = newname,
})

ngx.header["Content-Type"] = "application/json"
ngx.print(cjson.encode(file))
ngx.eof()
