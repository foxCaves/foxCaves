register_route("/api/v1/users/self", "PATCH", make_route_opts({ api_login = false }), function()
    local database = get_ctx_database()

    local args = get_post_args()
    local user = ngx.ctx.user

    if not check_user_password(user, args.current_password or "") then
        return api_error("current_password invalid", 403)
    end

    user.password = nil
    user.loginkey = nil
    user.sessionid = nil

    if args.email then
        if args.email:lower() == ngx.ctx.user.email:lower() then
            user.email = args.email
        else
            local emailcheck = check_email(args.email)
            if emailcheck == VALIDATION_STATE_INVALID then
                return api_error("email invalid")
            elseif emailcheck == VALIDATION_STATE_TAKEN then
                return api_error("email taken")
            else
                -- TODO: re-ask for verification here
                user.email = args.email
            end
        end
        database:query_safe('UPDATE users SET email = %s WHERE id = %s', user.email, user.id)
    end

    if args.password then
        database:query_safe('UPDATE users SET password = %s WHERE id = %s', argon2.hash_encoded(args.password, randstr(32)), user.id)
        user.password = "CHANGED"
        args.loginkey = "CHANGE"
    end

    if args.apikey then
        make_new_api_key()
    end

    if args.loginkey then
        make_new_login_key()
        user.loginkey = "CHANGED"
    end

    return user
end)
