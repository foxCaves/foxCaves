function user_require_email_confirmation(user)
	local redis = ngx.ctx.redis

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
    ngx.ctx.database:query_safe('UPDATE users SET active = 0 WHERE active = 1 AND id = %s', user.id)

	local emailkey = "emailkeys:" .. emailid
    redis:hmset(emailkey, "user", user.id, "action", "activation")
    redis:expire(emailkey, 172800) --48 hours

    mail(user.email, "foxCaves - Activation E-Mail", email_text, "noreply@foxcav.es", "foxCaves")

    return true
end

function make_new_login_key(userdata)
	local redis = ngx.ctx.redis

	local send_userdata = false
	local sessionid_skip = nil
	if not userdata then
		userdata = ngx.ctx.user
		if not userdata then
			return
		end
		send_userdata = true
		sessionid_skip = userdata.sessionid
	end

	local str = randstr(64)
    ngx.ctx.database:query_safe('UPDATE users SET loginkey = %s WHERE id = %s', str, userdata.id)

	raw_push_action({
		action = "kick",
	}, userdata)

	local allsessions = redis:keys("sessions:*")
	if type(allsessions) ~= "table" then allsessions = {} end

	redis:multi()
	for _,v in next, allsessions do
		if v ~= sessionid_skip and redis:get(v) == userdata.id then
			redis:del(v)
		end
	end
	redis:exec()

	if send_userdata then
		ngx.ctx.user.loginkey = str
		send_login_key()
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
    ngx.ctx.database:query_safe('UPDATE users SET apikey = %s WHERE id = %s', str, userdata.id)
end
