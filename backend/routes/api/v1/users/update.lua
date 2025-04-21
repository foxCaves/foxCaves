local utils = require('foxcaves.utils')
local consts = require('foxcaves.consts')
local user_model = require('foxcaves.models.user')
local totp = require('foxcaves.totp')

local ngx = ngx
local next = next

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

    local changes_obj = {}
    if args.email and args.email ~= '' then
        local emailcheck = user:set_email(args.email)
        if emailcheck == consts.VALIDATION_STATE_INVALID then
            return utils.api_error('email invalid')
        elseif emailcheck == consts.VALIDATION_STATE_TAKEN then
            return utils.api_error('email taken')
        end
        changes_obj.email = user.email
        changes_obj.email_valid = user.email_valid
        changes_obj.active = user:is_active() and 1 or 0
    end

    if args.password and args.password ~= '' then
        user:set_password(args.password)
        changes_obj.password = 'CHANGED'
        args.security_version = 'CHANGE'
    end

    if args.totp_secret and args.totp_secret ~= '' then
        if args.totp_secret == 'DISABLE' then
            user.totp_secret = ''
            changes_obj.totp_secret = 'DISABLED'
        else
            if not totp.is_valid_secret(args.totp_secret) then
                return utils.api_error('totp_secret invalid')
            end
            if not totp.check(args.totp_secret, args.totp_code) then
                return utils.api_error('totp_code invalid')
            end
            user.totp_secret = args.totp_secret
            changes_obj.totp_secret = 'CHANGED'
        end
        args.security_version = 'CHANGE'
    end

    if args.api_key and args.api_key ~= '' then
        user:make_new_api_key()
    end

    if args.security_version and args.security_version ~= '' then
        user:make_new_security_version()
        changes_obj.security_version = 'CHANGED'
    end

    user:save()

    local user_obj = user:get_private()
    for k, v in next, changes_obj do
        user_obj[k] = v
    end
    return user_obj
end)
