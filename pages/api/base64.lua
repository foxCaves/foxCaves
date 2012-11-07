dofile(ngx.var.main_root.."/scripts/global.lua")
dofile("scripts/api_login.lua")
if not ngx.ctx.user then return end

if(not ngx.ctx.user.is_pro) then
	ngx.status = 402
	ngx.print("not pro")
	return ngx.eof()
end

dofile("scripts/fileapi.lua")

local succ, data = file_download(ngx.var.query_string, ngx.ctx.user.id)
if(not succ) then
	ngx.status = 403
	ngx.print("failed")
	return ngx.eof()
end
ngx.print(ngx.encode_base64(data))
ngx.eof()