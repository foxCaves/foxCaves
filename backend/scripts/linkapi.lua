local database = ngx.ctx.database

function link_get(linkid)
	local link = database:get(database.KEYS.LINKS .. linkid)
	if (not link) or (link == ngx.null) then
		return nil
	end
	return link
end
