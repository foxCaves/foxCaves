register_route("/api/v1/users", "POST", make_route_opts_anon(), function()
    local args = get_post_args()

    local username = args.username or ""
    local email = args.email or ""
    local password = args.password or ""

    if args.agreetos ~= "yes" then
        return api_error("agreetos required")
    end
    if username == "" then
        return api_error("username required")
    end
    if email == "" then
        return api_error("email required")
    end
    if password == "" then
        return api_error("password required")
    end

    local user = User.New()
    user.active = 0
    user.bonusbytes = 0
    
    local usernamecheck = user:SetUsername(username)
    if usernamecheck == VALIDATION_STATE_INVALID then
        return api_error("username invalid")
    elseif usernamecheck == VALIDATION_STATE_TAKEN then
        return api_error("username taken")
    end
    
    local emailcheck = user:SetEMail(email)
    if emailcheck == VALIDATION_STATE_INVALID then
        return api_error("email invalid")
    elseif emailcheck == VALIDATION_STATE_TAKEN then
        return api_error("email taken")
    end
    
    user:SetPassword(password)
    user:MakeNewAPIKey()
    user:MakeNewLoginKey()
    
    user:Save()

    user:ComputeVirtuals()
    
    return user:GetPrivate()
end)
