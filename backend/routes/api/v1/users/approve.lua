local utils = require('foxcaves.utils')
local user_model = require('foxcaves.models.user')
local htmlgen = require('foxcaves.htmlgen')
local mail = require('foxcaves.mail')
local ngx = ngx

R.register_route(
    '/api/v1/users/{user}/approve',
    'GET',
    R.make_route_opts({ disable_api_key = true }),
    function(route_vars)
        local user = user_model.get_by_id(route_vars.user)
        if not user then
            return utils.api_error('User not found', 404)
        end
        if not ngx.ctx.user:is_admin() then
            return utils.api_error('You are not an admin', 403)
        end

        if user.approved == 1 then
            return utils.api_error('User is already approved', 400)
        end

        ngx.header['Content-Type'] = 'text/html'
        ngx.say('<!DOCTYPE html><html><head><title>Approve user</title></head><body>')
        ngx.say('<b>Username:</b> ' .. htmlgen.escape_html(user.username) .. '<br>')
        ngx.say('<b>Email:</b> ' .. htmlgen.escape_html(user.email) .. '<br>')
        ngx.say("<form method='POST' action=''><input type='submit' value='Approve'></form>")
        ngx.say('</body></html>')
        ngx.eof()
    end,
    {}
)

R.register_route(
    '/api/v1/users/{user}/approve',
    'POST',
    R.make_route_opts({ disable_api_key = true }),
    function(route_vars)
        local user = user_model.get_by_id(route_vars.user)
        if not user then
            return utils.api_error('User not found', 404)
        end
        if not ngx.ctx.user:is_admin() then
            return utils.api_error('You are not an admin', 403)
        end

        if user.approved == 1 then
            return utils.api_error('User is already approved', 400)
        end

        user.approved = 1

        user:save()

        local email = 'Your account has been approved by an administrator!'
        mail.send(user, 'Account approved', email)

        return user:get_public()
    end,
    {}
)
