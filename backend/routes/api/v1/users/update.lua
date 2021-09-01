local utils = require("foxcaves.utils")
local consts = require("foxcaves.consts")
local user_model = require("foxcaves.models.user")
local ngx = ngx

R.register_route("/api/v1/users/{user}", "PATCH", R.make_route_opts(), function(route_vars)
    local user = user_model.get_by_id(route_vars.user)
    if not user then
        return utils.api_error("User not found", 404)
    end
    if user.id ~= ngx.ctx.user.id then
        return utils.api_error("You are not allowed to update this user", 403)
    end

    local args = utils.get_post_args()

    if not ngx.ctx.user:check_password(args.current_password) then
        return utils.api_error("current_password invalid", 403)
    end

    local obj = {
        id = user.id,
        username = user.username,
    }

    if args.email then
        local emailcheck = user:set_email(args.email)
        if emailcheck == consts.VALIDATION_STATE_INVALID then
            return utils.api_error("email invalid")
        elseif emailcheck == consts.VALIDATION_STATE_TAKEN then
            return utils.api_error("email taken")
        end
        obj.email = user.email
        obj.active = user.active
    end

    if args.password then
        user:set_password(args.password)
        obj.password = "CHANGED"
        args.loginkey = "CHANGE"
    end

    if args.apikey then
        user:make_new_api_key()
    end

    if args.loginkey then
        user:make_new_login_key()
        obj.loginkey = "CHANGED"
    end

    user:save()

    obj.updated_at = user.updated_at
    obj.created_at = user.created_at

    return obj
end)
