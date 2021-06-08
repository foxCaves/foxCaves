dofile(ngx.var.main_root .. "/scripts/global.lua")
dofile("scripts/api_login.lua")
if not ngx.ctx.user then return end

local database = ngx.ctx.database
local files = database:zrevrange(database.KEYS.USER_FILES .. ngx.ctx.user.id, 0, -1)

if ngx.var.arg_type == "idonly" then
	ngx.print(cjson.encode(files))
else
	dofile("scripts/fileapi.lua")
	local results = {}
	for _,fileid in next, files do
		results[fileid] = file_get(fileid)
	end
	ngx.print(cjson.encode(results))
end
ngx.eof()
