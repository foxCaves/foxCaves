register_route("/api/v1/users/self/login", "POST", make_route_opts({ allow_guest = true, api_login = false }), function()
    local args = get_post_args()
    if not args then
        return api_error("No args")
    end

    if not args.username or args.username == "" then
        return api_error("No username")
    end

    if not args.password or args.password == "" then
        return api_error("No password")
    end

    local result = do_login(args.username, args.password)
    if result == LOGIN_USER_INACTIVE then
        api_error("Account inactive")
    elseif result == LOGIN_USER_BANNED then
        api_error("Account banned")
    elseif result == LOGIN_BAD_PASSWORD then
        api_error("Invalid username/password")
    elseif result ~= LOGIN_SUCCESS then
        api_error("Unknown login error")
    else
        if args.remember == "true" then
            ngx.ctx.user.remember_me = true
            send_login_key()
        end
    end
end)
