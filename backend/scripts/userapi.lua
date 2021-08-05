local database = ngx.ctx.database
local redis = ngx.ctx.redis

function user_require_email_confirmation(user)
	if not user then
		user = ngx.ctx.user
		if not user then
			return false
		end
	end

    local emailid = randstr(32)

    local email_text = "Hello, " .. user.username .. "!\n\nYou have recently registered or changed your E-Mail on foxCaves.\nPlease click the following link to activate your E-Mail:\n"
    email_text = email_text .. MAIN_URL .. "/email/code?code=" .. emailid .. "\n\n"
    email_text = email_text .. "Kind regards,\nfoxCaves Support"
    database:query_safe('UPDATE users SET active = 0 WHERE active = 1 AND id = %s', user.id)

	local emailkey = "emailkeys:" .. emailid
    redis:hmset(emailkey, "user", user.id, "action", "activation")
    redis:expire(emailkey, 172800) --48 hours

    mail(user.email, "foxCaves - Activation E-Mail", email_text, "noreply@foxcav.es", "foxCaves")

    return true
end

function make_new_login_key(userdata)
	local send_userdata = false
	if not userdata then
		userdata = ngx.ctx.user
		if not userdata then
			return
		end
		send_userdata = true
	end

	local str = randstr(64)
    database:query_safe('UPDATE users SET loginkey = %s WHERE id = %s', str, userdata.id)

	raw_push_action({
		action = "kick",
	}, userdata)

	local allsessions = database:keys("sessions:*")
	if type(allsessions) ~= "table" then allsessions = {} end

	if send_userdata then
		database:multi()
		for _,v in next, allsessions do
			if v ~= userdata.sessionid and database:get(v) == userdata.id then
				database:del(v)
			end
		end
		database:exec()
		ngx.ctx.user.loginkey = str
		ngx.ctx.send_login_key()
	else
		database:multi()
		for _,v in next, allsessions do
			if database:get(v) == userdata.id then
				database:del(v)
			end
		end
		database:exec()
	end
end

function make_new_api_key(userdata)
	if not userdata then
		userdata = ngx.ctx.user
		if not userdata then
			return
		end
	end
	local str = randstr(64)
	userdata.apikey = str
    database:query_safe('UPDATE users SET apikey = %s WHERE id = %s', str, userdata.id)
end
