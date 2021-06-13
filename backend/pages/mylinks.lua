dofile(ngx.var.main_root .. "/scripts/global.lua")
if not ngx.ctx.user then return ngx.redirect("/login") end

local database = ngx.ctx.database

local args = ngx.req.get_uri_args()

local message = ""

if args.delete then
	local id = args.delete
	local res = database:zrem(database.KEYS.USER_LINKS .. ngx.ctx.user.id, id)
	if res and res ~= ngx.null and res ~= 0 then
		database:del(database.KEYS.LINKS .. id)
		message = '<div class="alert alert-success">Deleted ' .. id .. '<a href="/myfiles" class="close" data-dismiss="alert">x</a></div>'
	else
		message = '<div class="alert alert-error">Could not delete the link :(<a href="/myfiles" class="close" data-dismiss="alert">x</a></div>'
	end
	raw_push_action({
		type = "link:delete",
		id = id,
	})
end

local function link_get(linkid)
	local link = database:get(database.KEYS.LINKS .. linkid)
	if (not link) or (link == ngx.null) then
		return nil
	end
	return link
end

local links = database:zrevrange(database.KEYS.USER_LINKS .. ngx.ctx.user.id, 0, -1)
dofile("scripts/fileapi.lua")
printTemplateAndClose("mylinks", {MAINTITLE = "My links", MESSAGE = message, LINKS = links, link_get = link_get})
