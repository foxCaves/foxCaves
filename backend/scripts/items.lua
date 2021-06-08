local database = ngx.ctx.database

local function gopro(time_seconds)
	local cur_time = ngx.time()
	if ngx.ctx.user.is_pro then
		cur_time = ngx.ctx.user.pro_expiry + time_seconds
	else
		cur_time = cur_time + time_seconds
	end
	ngx.ctx.user.pro_expiry = cur_time
	database:hset(database.KEYS.USERS .. ngx.ctx.user.id, "pro_expiry", cur_time)
end

local ONEMONTH = 30 * 24 * 60 * 60
local THREEMONTH = 3 * ONEMONTH
local SIXMONTH = 6 * ONEMONTH
local TWELVEMONTH = 12 * ONEMONTH

PAYPAL_EMAIL = "foxcaves@doridian.net"

ITEMS = {
	{
		title = "1 month Pro account",
		description = "A Pro account for 1 month",
		price = 2.50,
		action = function()
			gopro(ONEMONTH)
		end
	},
	{
		title = "3 month Pro account",
		description = "A Pro account for 3 months (16% discount)",
		price = 7.00,
		action = function()
			gopro(THREEMONTH)
		end
	},
	{
		title = "6 month Pro account",
		description = "A Pro account for 6 months (25% discount)",
		price = 12.00,
		action = function()
			gopro(SIXMONTH)
		end

	},
	{
		title = "12 month Pro account",
		description = "A Pro account for 12 months (30% discount)",
		price = 20.00,
		action = function()
			gopro(TWELVEMONTH)
		end
	}
}
