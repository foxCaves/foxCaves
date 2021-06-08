dofile(ngx.var.main_root .. "/scripts/global.lua")
dofile("scripts/api_login.lua")
if not ngx.ctx.user then return end

dofile("scripts/fileapi.lua")

ngx.req.read_body()
local data = ngx.req.get_body_data()
if(not data) then
	ngx.print("-")
	ngx.eof()
	return
end

--local res, filename = file_delete(ngx.var.arg_id, ngx.ctx.user.id)

ngx.print("+")
local id = ngx.ctx.user.id
for match in ngx.re.gmatch(data, "([a-zA-Z0-9]+)", "o") do
	res, filename = file_delete(match[1], id)
end

ngx.eof()
