dofile(ngx.var.main_root.."/scripts/global.lua")
if not ngx.ctx.user then return ngx.redirect("/login") end

local database = ngx.ctx.database

local args = ngx.req.get_uri_args()

local message = ""

if args.delete then
	local res = database:zrem(database.KEYS.USER_LINKS..ngx.ctx.user.id, args.delete)
	if res and res ~= ngx.null and res ~= 0 then
		database:del(database.KEYS.LINKS..args.delete)
		message = '<div class="alert alert-success">Deleted '..args.delete..'<a href="/myfiles" class="close" data-dismiss="alert">x</a></div>'
	else	
		message = '<div class="alert alert-error">Could not delete the link :(<a href="/myfiles" class="close" data-dismiss="alert">x</a></div>'
	end
elseif args.create then
	local linkid
	for i=1, 10 do
		linkid = randstr(10)
		local res = database:exists(database.KEYS.LINKS..linkid)
		if (not res) or (res == ngx.null) or (res == 0) then
			break
		else
			linkid = nil
		end
	end

	if not linkid then
		return ngx.exec("/error/500")
	end
	
	database:set(database.KEYS.LINKS..linkid, args.create)
	database:zadd(database.KEYS.USER_LINKS..ngx.ctx.user.id, ngx.time(), linkid)
end

local function link_get(linkid)
	local link = database:get(database.KEYS.LINKS..linkid)
	if (not link) or (link == ngx.null) then
		return nil
	end
	return link
end

dofile("scripts/navtbl.lua")
navtbl[3].active = true
local links = database:zrevrange(database.KEYS.USER_LINKS..ngx.ctx.user.id, 0, -1)
dofile("scripts/fileapi.lua")
ngx.print(load_template("mylinks", {MAINTITLE = "My links", MESSAGE = message, ADDLINKS = build_nav(navtbl), LINKS = links, link_get = link_get}))
ngx.eof()
