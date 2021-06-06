dofile(ngx.var.main_root .. "/scripts/global.lua")
if not ngx.ctx.user then return ngx.redirect("/login") end

ngx.redirect("/")

--[[
local database = ngx.ctx.database

local invoiceid
for i=1,10 do
	invoiceid = randstr(64)
	local res = database:sismember(database.KEYS.USEDINVOICES, invoiceid)
	if (not res) or (res == 0) or (res == ngx.null) then
		break
	else
		invoiceid = nil
	end
end
if not invoiceid then
	return ngx.exec("/error/500")
end

dofile("scripts/items.lua")
printTemplateAndClose("gopro", {MAINTITLE = "Go pro", ITEMS = ITEMS, INVOICEID = invoiceid, HIDE_GOPRO_LINKS = true})
]]
