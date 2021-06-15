local database = ngx.ctx.database

function link_shorturl(linkid)
	return SHORT_URL .. "/g" .. linkid
end

function link_get(linkid, user)
	if not linkid then return nil end
	local link = database:hgetall(database.KEYS.LINKS .. linkid)
	if (not link) or (link == ngx.null) or (not link.url) then return nil end
	if user and link.user ~= user then return nil end
	link.id = linkid
	link.short_url = link_shorturl(linkid)
	link.user = tonumber(link.user)
	link.time = tonumber(link.time)
	return link
end
