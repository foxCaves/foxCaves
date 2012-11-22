dofile(ngx.var.main_root.."/scripts/global.lua")
if not ngx.ctx.user then return ngx.redirect("/login") end

local database = ngx.ctx.database

local message = ""

ngx.req.read_body()
local args = ngx.ctx.get_post_args()
if args and args.old_password then
	if args.kill_sessions then
		message = "<div class='alert alert-success'>All other sessions have been killed</div>"
		ngx.ctx.make_new_login_key()
	elseif ngx.hmac_sha1(ngx.ctx.user.username, args.old_password) ~= ngx.ctx.user.password then
		message = "<div class='alert alert-error'>Current password is wrong</div>"
	elseif args.change_password then
		if (not args.password) or args.password == "" then
			message = "<div class='alert alert-error'>New password may not be empty</div>"				
		elseif args.password ~= args.password_confirm then
			message = "<div class='alert alert-error'>Password and confirmation do not match</div>"
		else
			local newpw = ngx.hmac_sha1(ngx.ctx.user.username, args.password)
			database:hset(database.KEYS.USERS..ngx.ctx.user.id, "password", newpw)
			message = "<div class='alert alert-success'>Password changed</div>"
			ngx.ctx.user.password = newpw
			ngx.ctx.make_new_login_key()
		end
	elseif args.change_email then
		if args.email:lower() == ngx.ctx.user.email:lower() then
			message = "<div class='alert alert-error'>This is the same E-Mail we already have on record for you!</div>"
		else
			local emailcheck = ngx.ctx.check_email(args.email)
			if emailcheck == ngx.ctx.EMAIL_INVALID then
				message = "<div class='alert alert-error'>E-Mail invalid</div>"
			elseif emailcheck == ngx.ctx.EMAIL_TAKEN then
				message = "<div class='alert alert-error'>E-Mail already taken</div>"
			else
				database:sadd(database.KEYS.EMAILS, args.email:lower())
				database:srem(database.KEYS.EMAILS, ngx.ctx.user.email:lower())
				database:hset(database.KEYS.USERS..ngx.ctx.user.id, "email", args.email)
				message = "<div class='alert alert-success'>E-Mail changed</div>"
				ngx.ctx.user.email = args.email
			end
		end
	end
end

dofile("scripts/navtbl.lua")
navtbl[4].active = true
ngx.print(load_template("myaccount", {MAINTITLE = "My account", MESSAGE = message, ADDLINKS = build_nav(navtbl)}))
ngx.eof()
