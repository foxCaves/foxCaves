dofile("/var/www/doripush/scripts/global.lua")
if not ngx.ctx.user then return ngx.redirect("/login") end

dofile("scripts/fileapi.lua")

local succ, data = file_download(ngx.var.query_string, ngx.ctx.user.id)
if(not succ) then
	ngx.status = 403
	ngx.print("failed")
	return ngx.eof()
end
ngx.print(ngx.encode_base64(data))
ngx.eof()