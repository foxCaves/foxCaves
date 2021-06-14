dofile(ngx.var.main_root .. "/scripts/global.lua")
if not ngx.ctx.user then return ngx.redirect("/login") end

local database = ngx.ctx.database

local message = ""

if ngx.var.arg_delete_ok == "true" then
	message = '<div class="alert alert-success">Deleted link <a href="/mylinks" class="close" data-dismiss="alert">x</a></div>'
elseif ngx.var.arg_delete_ok == "false" then
	message = '<div class="alert alert-error">Could not delete the link <a href="/mylinks" class="close" data-dismiss="alert">x</a></div>'
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
