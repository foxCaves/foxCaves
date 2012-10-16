dofile("/var/www/doripush/scripts/global.lua")
if not ngx.ctx.user then return ngx.redirect("/login") end

local database = ngx.ctx.database

local invoiceid
for i=1,10 do
	invoiceid = randstr(64)
	local res = database:query("SELECT 1 FROM usedinvoices WHERE id = '"..invoiceid.."'")
	if (not res) or (not res[1]) then
		break
	else
		invoiceid = nil
	end
end
if not invoiceid then
	ngx.print("Internal error!")
	return ngx.eof()
end

dofile("scripts/items.lua")
dofile("scripts/navtbl.lua")
ngx.print(load_template("gopro", {MAINTITLE = "Go pro", ADDLINKS = build_nav(navtbl), ITEMS = ITEMS, INVOICEID = invoiceid}))
ngx.eof()
