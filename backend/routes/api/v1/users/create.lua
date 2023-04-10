local utils = require('foxcaves.utils')
local consts = require('foxcaves.consts')
local user_model = require('foxcaves.models.user')

R.register_route('/api/v1/users', 'POST', R.make_route_opts_anon(), function()
    local args = utils.get_post_args()

    local username = args.username or ''
    local email = args.email or ''
    local password = args.password or ''

    if args.agreeTos ~= true and args.agreeTos ~= 'true' then
        return utils.api_error('agreeTos required')
    end
    if username == '' then
        return utils.api_error('username required')
    end
    if email == '' then
        return utils.api_error('email required')
    end
    if password == '' then
        return utils.api_error('password required')
    end

    local user = user_model.new()

    local usernamecheck = user:set_username(username)
    if usernamecheck == consts.VALIDATION_STATE_INVALID then
        return utils.api_error('username invalid')
    elseif usernamecheck == consts.VALIDATION_STATE_TAKEN then
        return utils.api_error('username taken')
    end

    local emailcheck = user:set_email(email)
    if emailcheck == consts.VALIDATION_STATE_INVALID then
        return utils.api_error('email invalid')
    elseif emailcheck == consts.VALIDATION_STATE_TAKEN then
        return utils.api_error('email taken')
    end

    user:set_password(password)

    user:save()

    return user:get_private()
end)
