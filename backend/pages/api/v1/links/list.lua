-- ROUTE:GET:/api/v1/links
dofile(ngx.var.main_root .. "/scripts/global.lua")
dofile("scripts/api_login.lua")
if not ngx.ctx.user then return end

local database = ngx.ctx.database
local links = database:zrevrange(database.KEYS.USER_LINKS .. ngx.ctx.user.id, 0, -1)

ngx.header["Content-Type"] = "application/json"
if ngx.var.arg_type == "idonly" then
	ngx.print(cjson.encode(links))
else
	dofile("scripts/linkapi.lua")
	local results = {}
	for _,linkid in next, links do
		results[linkid] = link_get(linkid)
	end
	ngx.print(cjson.encode(results))
end
ngx.eof()
