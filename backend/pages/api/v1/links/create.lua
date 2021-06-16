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
local short_url = link_shorturl(linkid)

database:hmset(database.KEYS.LINKS .. linkid, "user", ngx.ctx.user.id, "url", url, "time", ngx.time())
database:zadd(database.KEYS.USER_LINKS .. ngx.ctx.user.id, ngx.time(), linkid)

local linkinfo = {
	id = linkid,
	url = url,
	short_url = short_url,
}

raw_push_action({
	action = "link:create",
	link = linkinfo,
})
ngx.header["Content-Type"] = "application/json"
ngx.print(cjson.encode(linkinfo))
ngx.eof()
