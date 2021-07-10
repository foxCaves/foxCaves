function user_require_email_confirmation(user)
	if not user then
		user = ngx.ctx.user
		if not user then
			return false
		end
	end

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
        return false
    end

    local email_text = "Hello, " .. user.username .. "!\n\nYou have recently registered or changed your E-Mail on foxCaves.\nPlease click the following link to activate your E-Mail:\n"
    email_text = email_text .. MAIN_URL .. "/emailcode?code=" .. emailid .. "\n\n"
    email_text = email_text .. "Kind regards,\nfoxCaves Support"

    database:hmset(database.KEYS.USERS .. user.id, "active", 0)
    database:hmset(database.KEYS.EMAILKEYS .. emailid, "user", user.id, "action", "activation")
    database:expire(172800) --48 hours

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
	database:hmset(database.KEYS.USERS .. userdata.id, "loginkey", str)

	raw_push_action({
		action = "kick",
	}, userdata)

	local allsessions = database:keys(database.KEYS.SESSIONS .. "*")
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
	database:hset(database.KEYS.USERS .. userdata.id, "apikey", str)
end
