dofile("/var/www/doripush/scripts/global.lua")

local userid = ngx.req.get_uri_args().userid

if not userid then
	ngx.req.discard_body()
	paypal_result("Code: #INVALID")
	return ngx.eof()	
end

ngx.req.read_body()
local args = ngx.req.get_post_args()

local function paypal_result(str)
	local res = {}
	if args then
		for k,v in pairs(args) do
			table.insert(res, k .. " => ".. v .. "\n")
		end
	end
	mail("mriq91@gmail.com", "PayPal: DEBUG", str .. table.concat(res), "paypal@foxcav.es")
end

if not args then
	paypal_result("Code: #INVALID")
	return ngx.eof()
end

if args.payment_status:lower() ~= "completed" then
	paypal_result("Code: #NOTCOMPLETE")
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
local res = ngx.location.capture("/scripts/paypal_webscr", { method = ngx.HTTP_POST, body = ngx.encode_args(args) }).body
if not res:find("VERIFIED", 1, true) then
	paypal_result("Code: #NOTVERIFIED")
	return ngx.eof()
end

ngx.ctx.login(userid, "", true, true)
item.action()

paypal_result("Code: #SUCCESS")

ngx.eof()