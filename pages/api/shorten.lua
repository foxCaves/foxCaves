dofile(ngx.var.main_root .. "/scripts/global.lua")
dofile("scripts/api_login.lua")
if not ngx.ctx.user then return end

local database = ngx.ctx.database

local linkid
for i=1, 10 do
	linkid = randstr(10)
	local res = database:exists(database.KEYS.LINKS .. linkid)
	if (not res) or (res == ngx.null) or (res == 0) then
		break
	end
end

if not linkid then
	ngx.status = 500
	ngx.print("Internal error")
	return ngx.eof()
end

database:set(database.KEYS.LINKS .. linkid, ngx.var.query_string)
database:zadd(database.KEYS.USER_LINKS .. ngx.ctx.user.id, ngx.time(), linkid)

ngx.print(linkid .. "\n")
ngx.eof()