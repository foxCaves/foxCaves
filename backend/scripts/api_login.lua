if not ngx.ctx.user then
	local user, pw = parse_authorization_header(ngx.var.http_authorization)
	local success = false
	if user and pw then
		ngx.log(ngx.ERR, "U: " .. user)
		ngx.log(ngx.ERR, "P: " .. pass)
		success = (ngx.ctx.login(user, pw, { nosession = true, login_with_apikey = true }) == ngx.ctx.LOGIN_SUCCESS)
	end
	if not ALLOW_GUEST and ((not success) or (not ngx.ctx.user)) then
		ngx.status = 401
		ngx.print("Wrong username/password")
		return ngx.eof()
	end
end
