local database = ngx.ctx.database

function link_shorturl(linkid)
	return SHORT_URL .. "/g" .. linkid
end

function link_get(linkid)
	local url = database:get(database.KEYS.LINKS .. linkid)
	if (not url) or (url == ngx.null) then
		return nil
	end
	return {
		id = linkid,
		url = url,
		short_url = link_shorturl(linkid),
	}
end
