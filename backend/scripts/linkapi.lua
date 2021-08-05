local database = ngx.ctx.database

function link_shorturl(linkid)
	return SHORT_URL .. "/g" .. linkid
end

function link_get(linkid, user)
	if not linkid then
		return nil
	end
	local link
	if linkid.id then
		link = linkid
		linkid = link.id
	else
		link = database:query_safe('SELECT * FROM links WHERE id = %s', linkid)
		link = link[1]
	end

	if not link then
		return nil
	end
	if user and link.user ~= user then return nil end
	link.id = linkid
	link.short_url = link_shorturl(linkid)
	return link
end
