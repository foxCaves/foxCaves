-- ROUTE:GET:/api/v1/links
dofile(ngx.var.main_root .. "/scripts/global.lua")
dofile("scripts/api_login.lua")
if not ngx.ctx.user then return end

local database = ngx.ctx.database
local links = database:query_safe('SELECT * FROM links WHERE user = "%s"', ngx.ctx.user.id)

dofile("scripts/linkapi.lua")
local results = {}
for _, link in next, links do
	table.insert(results, link_get(link))
end
ngx.print(cjson.encode(results))
ngx.eof()
