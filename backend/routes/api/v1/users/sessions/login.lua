local utils = require('foxcaves.utils')
local auth = require('foxcaves.auth')
local auth_utils = require('foxcaves.auth_utils')
local ngx = ngx

R.register_route('/api/v1/users/sessions/login', 'POST', R.make_route_opts_anon(), function()
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

    if not auth.login(args.username, args.password) then
        return utils.api_error('Invalid username/password', 401)
    end

    if args.remember == 'true' or args.remember == true then
        ngx.ctx.remember_me = true
        auth_utils.send_login_key()
    end

    return ngx.ctx.user:get_private()
end)