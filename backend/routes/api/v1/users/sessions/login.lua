local utils = require('foxcaves.utils')
local auth = require('foxcaves.auth')
local captcha = require('foxcaves.captcha')
local ngx = ngx

R.register_route('/api/v1/users/sessions', 'POST', R.make_route_opts_anon(), function()
    local args = utils.get_post_args()
    if not args then
        return utils.api_error('No args')
    end

    if not args.username or args.username == '' then
        return utils.api_error('No username')
    end
    if not args.password or args.password == '' then
        return utils.api_error('No password')
    end

    if not captcha.check('login', args) then
        return captcha.error()
    end

    if not auth.login(
        args.username,
        {
            password = args.password,
            totp = args.totp,
        },
        {
            remember = args.remember == 'true' or args.remember == true,
            login_method = auth.LOGIN_METHOD_PASSWORD,
        }
    ) then
        return utils.api_error('Invalid username/password', 401)
    end

    return ngx.ctx.user:get_private()
end)
