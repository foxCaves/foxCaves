if ngx.ctx.user then
	navtbl = {
		{
			url = "/",
			title = "Home"
		},
		{
			url = "/myfiles",
			title = "My files"
		},
		{
			url = "/myaccount",
			title = "My account"
		}
	}
else
	navtbl = {
		{
			url = "/",
			title = "Home"
		},
		{
			url = "/login",
			title = "Login"
		},
		{
			url = "/register",
			title = "Register"
		}
	}
end
