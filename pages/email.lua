dofile("/var/www/foxcaves/scripts/global.lua")
if ngx.ctx.user then return ngx.redirect("/myaccount") end

local database = ngx.ctx.database

local message = ""
local template_name = "email"

local action = ngx.var.email_action

local username = ""
local email = ""
local captcha_error = ""

local actiontitle
if action == "activation" then
	actiontitle = "Activation E-Mail"
elseif action == "forgotpwd" then
	actiontitle = "Forgot password"
else
	ngx.req.discard_body()
	ngx.print(load_template("message", {MAINTITLE = "Error", MESSAGE = "Invalid action"}))
	return ngx.eof()
end

dofile("scripts/captcha.lua")

ngx.req.read_body()
local args = ngx.ctx.get_post_args()
if args and args.send then
	username = args.username or ""
	email = args.email or ""
	if username == "" then
		message = "<div class='alert alert-error'>Username may not be empty</div>"
	elseif email == "" then
		message = "<div class='alert alert-error'>E-Mail may not be empty</div>"
	else
		local valid
		valid, captcha_error = check_captcha(args)
		if not valid then
			message = "<div class='alert alert-error'>Error validating your CAPTCHA</div>"
		else
			local userdata = database:query("SELECT id, username, email FROM users WHERE username = '"..database:escape(username).."' AND email = '"..database:escape(email).."'")
			if (not userdata) or (not userdata[1]) then
				message = "<div class='alert alert-error'>There is no user with the specified username and E-Mail on record</div>"
			else
				userdata = userdata[1]
				
				local emailid
				for i=1,10 do
					emailid = randstr(32)
					local res = database:query("SELECT 1 FROM emailkeys WHERE id = '"..emailid.."'")
					if (not res) or (not res[1]) then
						break
					else
						emailid = nil
					end
				end
				
				if not emailid then
					message = "<div class='alert alert-error'>Internal error. Please try again</div>"
				else
					local email = "Hello, "..userdata.username.."!\n\nYou have recently requested to "
					local subject
					if action == "activation" then
						email = email .. " have your activation E-Mail resent. To activate your user account"
						subject = "foxCaves - Activate your account"
					elseif action == "forgotpwd" then
						email = email .. " reset your password. To have a random password sent to you E-Mail"
						subject = "foxCaves - Reset your password"
					end
					email = email .. " just click on the following link:\nhttps://foxcav.es/emailcode?"..emailid.."\n\nKind regards,\nfoxCaves Support"

					database:query("INSERT INTO emailkeys (id, user, action, expire) VALUES ('"..emailid.."', '"..userdata.id.."', '"..database:escape(action).."', UNIX_TIMESTAMP() + 172800)") --48 hours
					message = "<div class='alert alert-warning'>E-Mail sent.</div>"
					template_name = "message"
					mail(userdata.email, subject, email, "noreply@foxcav.es")
				end
			end
		end
	end
end

dofile("scripts/navtbl.lua")
ngx.print(load_template(template_name, {MAINTITLE = actiontitle, MESSAGE = message, ADDLINKS = build_nav(navtbl), USERNAME = username, EMAIL = email, CAPTCHA = generate_captcha(captcha_error)}))
ngx.eof()
