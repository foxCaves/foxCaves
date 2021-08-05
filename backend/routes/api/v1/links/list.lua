-- ROUTE:GET:/api/v1/links
dofile(ngx.var.main_root .. "/scripts/global.lua")
dofile("scripts/api_login.lua")
if not ngx.ctx.user then return end

local database = ngx.ctx.database
local links = database:zrevrange(database.KEYS.USER_LINKS .. ngx.ctx.user.id, 0, -1)

dofile("scripts/linkapi.lua")
local results = {}
for _,linkid in next, links do
	table.insert(results, link_get(linkid))
end
ngx.print(cjson.encode(results))
ngx.eof()
