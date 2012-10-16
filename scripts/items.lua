local database = ngx.ctx.database

local function gopro(time_seconds)
	local cur_time = ngx.time()
	if ngx.ctx.user.pro_expiry > cur_time then
		cur_time = ngx.ctx.user.pro_expiry + time_seconds
	else
		cur_time = cur_time + time_seconds
	end
	ngx.ctx.user.pro_expiry = cur_time
	database:query("UPDATE users SET pro_expiry = "..cur_time..", totalbytes = 1073741824 WHERE id = "..ngx.ctx.user.id)
end

local ONEMONTH = 30 * 24 * 60 * 60
local THREEMONTH = 3 * ONEMONTH
local SIXMONTH = 6 * ONEMONTH
local TWELVEMONTH = 12 * ONEMONTH

PAYPAL_EMAIL = "mriq91_1350399677_biz@gmail.com"

ITEMS = {}
ITEMS[1] = {
	title = "1 month pro account",
	description = "A pro account for 1 month",
	price = 10.00,
	action = function()
		gopro(ONEMONTH)
	end
}
ITEMS[2] = {
	title = "3 month pro account",
	description = "A pro account for 3 months",
	price = 25.00,
	action = function()
		gopro(THREEMONTH)
	end
}
ITEMS[3] = {
	title = "6 month pro account",
	description = "A pro account for 6 months",
	price = 45.00,
	action = function()
		gopro(SIXMONTH)
	end
}
ITEMS[4] = {
	title = "12 month pro account",
	description = "A pro account for 3 months",
	price = 85.00,
	action = function()
		gopro(TWELVEMONTH)
	end
}