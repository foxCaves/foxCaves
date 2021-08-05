-- ROUTE:GET:/api/v1/files
dofile(ngx.var.main_root .. "/scripts/global.lua")
dofile("scripts/api_login.lua")
if not ngx.ctx.user then return end

local database = ngx.ctx.database
local files = database:query_safe('SELECT * FROM files WHERE user = "%s"', ngx.ctx.user.id)

dofile("scripts/fileapi.lua")
local results = {}
for _, file in next, files do
	table.insert(results, file_get(file))
end
ngx.print(cjson.encode(results))
ngx.eof()
