-- ROUTE:GET:/api/shorten
-- ROUTE:POST:/api/v1/links
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

local url = ngx.unescape_uri(ngx.var.arg_url)
local short_url = SHORT_URL .. "/g" .. linkid

database:set(database.KEYS.LINKS .. linkid, url)
database:zadd(database.KEYS.USER_LINKS .. ngx.ctx.user.id, ngx.time(), linkid)

raw_push_action({
	type = "link:create",
	id = linkid,
	url = url,
	short_url = short_url,
})

ngx.header["Content-Type"] = "application/json"
ngx.print(cjson.encode({
	id = linkid,
	url = url,
	short_url = short_url,
}))
ngx.eof()
