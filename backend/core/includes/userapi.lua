function user_require_email_confirmation(user)
	local redis = get_ctx_redis()

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
    get_ctx_database():query_safe('UPDATE users SET active = 0 WHERE active = 1 AND id = %s', user.id)

	local emailkey = "emailkeys:" .. emailid
    redis:hmset(emailkey, "user", user.id, "action", "activation")
    redis:expire(emailkey, 172800) --48 hours

    mail(user.email, "foxCaves - Activation E-Mail", email_text, "noreply@foxcav.es", "foxCaves")

    return true
end

function user_calculate_usedbytes(user)
	local res = get_ctx_database():query_safe('SELECT SUM(size) AS usedbytes FROM files WHERE "user" = %s', user.id)
	return res[1].usedbytes or 0
end

function make_new_login_key(userdata)
	local redis = get_ctx_redis()

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
    get_ctx_database():query_safe('UPDATE users SET loginkey = %s WHERE id = %s', str, userdata.id)

	raw_push_action({
		action = "kick",
	}, userdata)

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
    get_ctx_database():query_safe('UPDATE users SET apikey = %s WHERE id = %s', str, userdata.id)
end
