dofile(ngx.var.main_root .. "/scripts/global.lua")
if ngx.ctx.user then return ngx.redirect("/myaccount") end
local database = ngx.ctx.database

local codeID = database.KEYS.EMAILKEYS .. ngx.var.args
local res = database:hgetall(codeID)

local actiontitle, message
if res and res.user and res ~= ngx.null then
	local userID = database.KEYS.USERS .. res.user

	local userdata = database:hgetall(userID)

	if res.action == "activation" then
		actiontitle = "Activation"

		if userdata.active and userdata.active ~= "0" and userdata.active ~= 0 then
			message = "<div class='alert alert-success'>Your account was already active or is banned</div>"
		else
			message = "<div class='alert alert-success'>Your account has been activated. Please <a href='/login'>login</a> now.</div>"
			database:hset(userID, "active", 1)
		end
	elseif res.action == "forgotpwd" then
		actiontitle = "Forgot password"
		message = "<div class='alert alert-success'>A new password has been sent to you. Once you received it, please <a href='/login'>login</a>.</div>"

		local newPassword = randstr(16)

		database:hset(userID, "password", ngx.hmac_sha1(userdata.username, newPassword))

		local email = "Hello, " .. userdata.username .. "!\n\nHere is your new password:\n" .. newPassword .. "\nPlease log in at https://foxcav.es/login and change it as soon as possible.\n\nKind regards,\nfoxCaves Support"
		mail(userdata.email, "foxCaves - New password", email, "noreply@foxcav.es", "foxCaves")

		userdata.id = userID
		ngx.ctx.make_new_login_key(userdata)
	end

	database:del(codeID)
else
	actiontitle = "Invalid code"
	message = "<div class='alert alert-error'>Sorry, but your code is invalid or expired</div>"
end

printTemplateAndClose("message", {MAINTITLE = actiontitle, MESSAGE = message})
