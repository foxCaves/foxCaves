register_route("/api/v1/users/emails/code", "POST", make_route_opts_anon(), function()
    local redis = get_ctx_redis()
    local args = get_post_args()

    local code = args.code or ""
    if code == "" then
        return api_error("code required")
    end

    local codekey = "emailkeys:" .. ngx.unescape_uri(args.code)
    local res = redis:hgetall(codekey)
    redis:del(codekey)
    if not (res and res.user and res ~= ngx.null) then
        return api_error("code invalid")
    end

    local user = User.GetByID(res.user)
    if not user then
        return api_error("Bad user")
    end

    if res.action == "activation" then
        user.active = 1
        user:Save()
    elseif res.action == "forgotpwd" then
        local newPassword = randstr(16)
    
        user:SetPassword(newPassword)
        user:MakeNewLoginKey()
        user:Save()

        local email = "Hello, " .. user.username .. "!\n\nHere is your new password:\n" .. newPassword .. "\nPlease log in at " .. MAIN_URL .. "/login and change it as soon as possible.\n\nKind regards,\nfoxCaves Support"
        mail(user.email, "foxCaves - New password", email, "noreply@foxcav.es", "foxCaves")
    end

    return { action = res.action }
end)
