dofile(ngx.var.main_root .. "/scripts/global.lua")
if ngx.ctx.user then return ngx.redirect("/myaccount") end
--do ngx.print("Disabled") return ngx.eof() end

local database = ngx.ctx.database

local message = ""
local template_name = "register"

local username = ""
local email = ""
local captcha_error = ""

dofile("scripts/captcha.lua")

local args = ngx.ctx.get_post_args()
if args and args.register then
	username = args.username or ""
	email = args.email or ""
	if username == "" then
		message = "<div class='alert alert-error'>Username may not be empty</div>"
	elseif email == "" then
		message = "<div class='alert alert-error'>E-Mail may not be empty</div>"
	else
		local usernamecheck = ngx.ctx.check_username(args.username)
		if usernamecheck == ngx.ctx.EMAIL_INVALID then
			message = "<div class='alert alert-error'>Username invalid (it may only contain letters (A-Z, a-z), numbers (0-9), spaces, as well as the following symbols: .,;_-</div>"
		elseif usernamecheck == ngx.ctx.EMAIL_TAKEN then
			message = "<div class='alert alert-error'>Username already taken</div>"
		else
			local emailcheck = ngx.ctx.check_email(email)
			if emailcheck == ngx.ctx.EMAIL_INVALID then
				message = "<div class='alert alert-error'>E-Mail invalid</div>"
			elseif emailcheck == ngx.ctx.EMAIL_TAKEN then
				message = "<div class='alert alert-error'>E-Mail already taken</div>"
			elseif (not args.password) or args.password == "" then
				message = "<div class='alert alert-error'>Password may not be empty</div>"
			elseif args.password ~= args.password_confirm then
				message = "<div class='alert alert-error'>Password and confirmation do not match</div>"
			else
				local valid
				valid, captcha_error = check_captcha(args)
				if not valid then
					message = "<div class='alert alert-error'>Error validating your CAPTCHA</div>"
				else

					local emailid
					for i=1, 10 do
						emailid = randstr(32)
						local res = database:exists(database.KEYS.EMAILKEYS .. emailid)
						if (not res) or (res == ngx.null) or (res == 0) then
							break
						else
							emailid = nil
						end
					end

					if not emailid then
						message = "<div class='alert alert-error'>Internal error. Please try again</div>"
					else
						local userid = database:incr(database.KEYS.NEXTUSERID)

						database:hmset(database.KEYS.USERS .. userid, "username", args.username, "email", email, "password", ngx.hmac_sha1(args.username, args.password))
						database:sadd(database.KEYS.EMAILS, email:lower())
						database:set(database.KEYS.USERNAME_TO_ID .. args.username:lower(), userid)

						local email_text = "Hello, " .. args.username .. "!\n\nYou have recently registered on foxCaves.\nPlease click the following link to activate your account:\n"
						email_text = email_text .. MAIN_URL .. "/emailcode?code=" .. emailid .. "\n\n"
						email_text = email_text .. "Kind regards,\nfoxCaves Support"

						database:hmset(database.KEYS.EMAILKEYS .. emailid, "user", userid, "action", "activation")
						database:expire(172800) --48 hours

						mail(email, "foxCaves - Welcome!", email_text, "noreply@foxcav.es", "foxCaves")

						message = "<div class='alert alert-warning'>You are now registered. Please click the link in the activation E-Mail to log in.</div>"
						template_name = "message"

						ngx.ctx.make_new_login_key({id = userid})
					end
				end
			end
		end
	end
end

printTemplateAndClose(template_name, {MAINTITLE = "Register", MESSAGE = message, USERNAME = username, EMAIL = email, CAPTCHA = generate_captcha(captcha_error)})
