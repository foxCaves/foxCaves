dofile(ngx.var.main_root .. "/scripts/global.lua")

local name = ngx.var.REQUEST_URI
local nameregex = ngx.re.match(name, "g/([a-zA-Z0-9]+)$", "o")

if (not nameregex) or (not nameregex[1]) then
	return ngx.exec("/error/403")
end

nameregex = nameregex[1]

local database = ngx.ctx.database

local link = database:get(database.KEYS.LINKS .. nameregex)
if (not link) or (link == ngx.null) then
	return ngx.exec("/error/404")
end

return ngx.redirect(link)
