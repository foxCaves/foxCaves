if not ngx.ctx.user then
	local user = ngx.var.http_X_Foxcaves_User
	local pw = ngx.var.http_X_Foxcaves_Password
	local success = false
	if user and pw then
		success = (ngx.ctx.login(user,pw,true) == ngx.ctx.LOGIN_SUCCESS)
	end
	if (not success) and ngx.ctx.user then
		ngx.status = 403
		ngx.print("Wrong username/password")
		return ngx.eof()
	end
end