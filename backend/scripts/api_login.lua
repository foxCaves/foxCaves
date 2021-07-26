if not ngx.ctx.user then
	local user, apikey = parse_authorization_header(ngx.var.http_authorization)
	if user and apikey then
		local success = (ngx.ctx.login(user, apikey, { nosession = true, login_with_apikey = true }) == ngx.ctx.LOGIN_SUCCESS)
		if not success then
			api_error("Invalid username or API key", 401)
		end
	end
	if not ngx.ctx.user then
		api_not_logged_in_error()
	end
end
