dofile(ngx.var.main_root .. "/scripts/global.lua")
dofile("scripts/api_login.lua")
if not ngx.ctx.user then return end

dofile("scripts/fileapi.lua")

ngx.req.read_body()
local data = ngx.req.get_body_data()
if not data then
	ngx.status = 400
	ngx.print("No body")
	ngx.eof()
	return
end

data = cjson.decode(data)

local results = {}
local userid = ngx.ctx.user.id
for _, fileid in pairs(data) do
	local res, _ = file_delete(fileid, userid)
	results[fileid] = res
end
ngx.print(cjson.encode(results))
ngx.eof()
