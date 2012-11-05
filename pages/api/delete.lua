dofile("/var/www/foxcaves/scripts/global.lua")
dofile("scripts/api_login.lua")
if not ngx.ctx.user then return end

dofile("scripts/fileapi.lua")

local res, filename = file_delete(ngx.var.query_string, ngx.ctx.user.id)

if res then
	ngx.print("+"..filename)
else
	ngx.print("-")
end

ngx.eof()