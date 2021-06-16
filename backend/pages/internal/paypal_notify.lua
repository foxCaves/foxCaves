-- ROUTE:POST:/internal/paypal_notify
dofile(ngx.var.main_root .. "/scripts/global.lua")
local database = ngx.ctx.database

if DISABLE_PAYMENTS then return ngx.eof() end

local userid = ngx.var.arg_userid
local args

local function paypal_result(str, noemail)
	if noemail then return end
	local res = {}
	if args then
		for k,v in next, args do
			table.insert(res, k .. " => ".. v .. "\n")
		end
	end
	mail("foxcaves@doridian.net", "[foxCaves] PayPal DEBUG", str .. "\nIP: " .. ngx.var.remote_addr .. "\nUserID: " .. (userid or "N/A") .. "\nPOST DATA\n" .. table.concat(res), "noreply@foxcav.es", "foxCaves")
end


if not userid then
	ngx.req.discard_body()
	paypal_result("Code: #INVALID", true)
	return ngx.eof()
end

args = ngx.ctx.get_post_args()

if not args then
	paypal_result("Code: #INVALID", true)
	return ngx.eof()
end

if args.payment_status:lower() ~= "completed" then
	paypal_result("Code: #NOTCOMPLETE")
	return ngx.eof()
end

local res = database:sismember(database.KEYS.USEDINVOICES, args.invoice)
if res and res ~= 0 and res ~= ngx.null then
	paypal_result("Code: #DOUBLE_INVOICE")
	return ngx.eof()
end

dofile("scripts/items.lua")
if args.mc_currency:lower() ~= "usd" or args.receiver_email ~= PAYPAL_EMAIL then
	paypal_result("Code: #CURRENCY_OR_EMAIL")
	return ngx.eof()
end

local item = ITEMS[tonumber(args.item_number)]
if (not item) or item.price ~= tonumber(args.mc_gross) then
	paypal_result("Code: #ITEM_OR_PRICE")
	return ngx.eof()
end

args.cmd = "_notify-validate"
local res = ngx.location.capture("/scripts/paypal_webscr", {
	method = ngx.HTTP_POST, body = ngx.encode_args(args)
}).body
if not res:find("VERIFIED", 1, true) then
	paypal_result("Code: #NOTVERIFIED")
	return ngx.eof()
end

ngx.ctx.login(userid, "", { nosession = true, login_with_id = true })
item.action()

database:sadd(database.KEYS.USEDINVOICES, args.invoice)

paypal_result("Code: #SUCCESS")
ngx.eof()
