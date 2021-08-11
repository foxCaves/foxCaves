local utils = require("foxcaves.utils")

register_route("/api/v1/users/self", "PATCH", make_route_opts({ api_login = false }), function()
    local args = utils.get_post_args()
    local user = ngx.ctx.user

    if not user:CheckPassword(args.current_password) then
        return utils.api_error("current_password invalid", 403)
    end

    local obj = {
        id = user.id,
        username = user.username,
    }

    if args.email then
        local emailcheck = user:SetEMail(args.email)
        if emailcheck == VALIDATION_STATE_INVALID then
            return utils.api_error("email invalid")
        elseif emailcheck == VALIDATION_STATE_TAKEN then
            return utils.api_error("email taken")
        end
        obj.email = user.email
    end

    if args.password then
        user:SetPassword(args.password)
        obj.password = "CHANGED"
        args.loginkey = "CHANGE"
    end

    if args.apikey then
        user:MakeNewAPIKey()
    end

    if args.loginkey then
        user:MakeNewLoginKey()
        obj.loginkey = "CHANGED"
    end

    user:Save()

    return obj
end)
