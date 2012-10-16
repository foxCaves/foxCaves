dofile("/var/www/doripush/scripts/global.lua")
if ngx.ctx.user then return ngx.redirect("/user") end

local database = ngx.ctx.database

local res = database:query("SELECT id, user, action FROM emailkeys WHERE id = '"..database:escape(ngx.var.query_string).."'")

local actiontitle, message

if res and res[1] then
	res = res[1]

	if res.action == "activation" then
		actiontitle = "Activation"
		message = "<div class='alert alert-success'>Your account has been activated. Please <a href='/login'>login</a> now.</div>"
		database:query("UPDATE users SET active = 1 WHERE id = '"..res.user.."' AND active = 0")
	elseif res.action == "forgotpwd" then
		actiontitle = "Forgot password"
		message = "<div class='alert alert-success'>A new password has been sent to you. Once you received it, please <a href='/login'>login</a>.</div>"

		local userdata = database:query("SELECT * FROM users WHERE id = '"..res.user.."'")[1]

		local newPassword = randstr(16)

		database:query("UPDATE users SET password = '"..database:escape(ngx.hmac_sha1(userdata.username, newPassword)).."' WHERE id = '"..res.user.."'")

		local email = "Hello, "..userdata.username.."!\n\nHere is your new password:\n"..newPassword.."\nPlease log in at https://foxcav.es/login and change it as soon as possible.\n\nKind regards,\nfoxCaves Support"
		mail(userdata.email, "foxCaves - New password", email, "noreply@foxcav.es")

		ngx.ctx.make_new_login_key(userdata)
	end

	database:query("DELETE FROM emailkeys WHERE id = '"..database:escape(res.id).."'")
else
	actiontitle = "Invalid code"
	message = "<div class='alert alert-error'>Sorry, but your code is invalid or expired</div>"
end

dofile("scripts/navtbl.lua")
ngx.print(load_template("message", {MAINTITLE = actiontitle, MESSAGE = message, ADDLINKS = build_nav(navtbl)}))
