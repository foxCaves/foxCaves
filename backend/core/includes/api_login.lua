function check_api_login(allow_guest)
	if ngx.ctx.user then
		return
	end

	local user, apikey = parse_authorization_header(ngx.var.http_authorization)
	if user and apikey then
		local success = (do_login(user, apikey, { nosession = true, login_with_apikey = true }) == LOGIN_SUCCESS)
		if not success then
			api_error("Invalid username or API key", 401)
		end
	end
	
	if (not allow_guest) and (not ngx.ctx.user) then
		api_not_logged_in_error()
	end
end
