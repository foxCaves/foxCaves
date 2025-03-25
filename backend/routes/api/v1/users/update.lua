local utils = require('foxcaves.utils')
local consts = require('foxcaves.consts')
local user_model = require('foxcaves.models.user')
local totp = require('foxcaves.totp')
local ngx = ngx

R.register_route('/api/v1/users/{user}', 'PATCH', R.make_route_opts({ disable_api_key = true }), function(route_vars)
    local user = user_model.get_by_id(route_vars.user)
    if not user then
        return utils.api_error('User not found', 404)
    end
    if not user:can_edit(ngx.ctx.user) then
        return utils.api_error('You do not have permission to edit this user', 403)
    end

    local args = utils.get_post_args()

    if not ngx.ctx.user:check_password(args.current_password) then
        return utils.api_error('current_password invalid', 403)
    end

    local obj = {
        id = user.id,
        username = user.username,
    }

    if args.email and args.email ~= '' then
        local emailcheck = user:set_email(args.email)
        if emailcheck == consts.VALIDATION_STATE_INVALID then
            return utils.api_error('email invalid')
        elseif emailcheck == consts.VALIDATION_STATE_TAKEN then
            return utils.api_error('email taken')
        end
        obj.email = user.email
        obj.email_valid = user.email_valid
        obj.active = user:is_active() and 1 or 0
    end

    if args.password and args.password ~= '' then
        user:set_password(args.password)
        obj.password = 'CHANGED'
        args.security_version = 'CHANGE'
    end

    if args.totp_secret and args.totp_secret ~= '' then
        if args.totp_secret == 'DISABLE' then
            user.totp_secret = ''
            obj.totp_secret = 'DISABLED'
        else
            if not totp.is_valid_secret(args.totp_secret) then
                return utils.api_error('totp_secret invalid')
            end
            if not totp.check(args.totp_secret, args.totp_code) then
                return utils.api_error('totp_code invalid')
            end
            user.totp_secret = args.totp_secret
            obj.totp_secret = 'CHANGED'
        end
        args.security_version = 'CHANGE'
    end

    if args.api_key and args.api_key ~= '' then
        user:make_new_api_key()
    end

    if args.security_version and args.security_version ~= '' then
        user:make_new_security_version()
        obj.security_version = 'CHANGED'
    end

    user:save()

    obj.updated_at = user.updated_at
    obj.created_at = user.created_at

    return obj
end)
