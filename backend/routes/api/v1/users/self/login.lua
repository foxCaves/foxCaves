local utils = require("foxcaves.utils")
local consts = require("foxcaves.consts")
local auth = require("foxcaves.auth")
local ngx = ngx

register_route("/api/v1/users/self/login", "POST", make_route_opts({ allow_guest = true, api_login = false }), function()
    local args = utils.get_post_args()
    if not args then
        return utils.api_error("No args")
    end

    if not args.username or args.username == "" then
        return utils.api_error("No username")
    end

    if not args.password or args.password == "" then
        return utils.api_error("No password")
    end

    local result = auth.login(args.username, args.password)
    if result == consts.USER_INACTIVE then
        return utils.api_error("Account inactive")
    elseif result == consts.LOGIN_USER_BANNED then
        return utils.api_error("Account banned")
    elseif result == consts.LOGIN_BAD_CREDENTIALS then
        return utils.api_error("Invalid username/password")
    elseif result ~= consts.LOGIN_SUCCESS then
        return utils.api_error("Unknown login error")
    else
        if args.remember == "true" then
            ngx.ctx.remember_me = true
            auth.send_login_key()
        end
    end

    return ngx.ctx.user:GetPrivate()
end)
