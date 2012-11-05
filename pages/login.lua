dofile("/var/www/foxcaves/scripts/global.lua")

local message = ""

local args = ngx.req.get_uri_args()
if args and args.logout then
	ngx.req.discard_body()
	ngx.ctx.logout()

	message = "<div class='alert alert-success'>You are now logged out</div>"
else
	if ngx.ctx.user then
		ngx.req.discard_body()
		return ngx.redirect("/myaccount")
	end

	ngx.req.read_body()
	args = ngx.ctx.get_post_args()
	if args and args.login then
		if (not args.username) or args.username == "" then
			message = "<div class='alert alert-error'>Username may not be empty</div>"
		elseif (not args.password) or args.password == "" then
			message = "<div class='alert alert-error'>Password may not be empty</div>"
		else
			local result = ngx.ctx.login(args.username, args.password)
			if result == ngx.ctx.LOGIN_USER_INACTIVE then
				message = "<div class='alert alert-error'>Your account is not activated yet. <a href='/email/activation'>Resend activation E-Mail?</a></div>"
			elseif result == ngx.ctx.LOGIN_USER_BANNED then
				message = "<div class='alert alert-error'>Your account is banned</div>"
			elseif result == ngx.ctx.LOGIN_BAD_PASSWORD then
				message = "<div class='alert alert-error'>Invalid username/password. <a href='/email/forgotpwd'>Forgot your password?</a></div>"
			elseif result == ngx.ctx.LOGIN_SUCCESS then
				if args.remember == "yes" then
					ngx.ctx.user.remember_me = true
					ngx.ctx.send_login_key()
				end
				return ngx.redirect("/myfiles")
			else
				message = "<div class='alert alert-error'>Unknown login error</div>"
			end
		end
	end
end

dofile("scripts/navtbl.lua")
navtbl[2].active = true
ngx.print(load_template("login", {MAINTITLE = "Login", MESSAGE = message, ADDLINKS = build_nav(navtbl)}))
ngx.eof()
