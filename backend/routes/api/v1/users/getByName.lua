local utils = require('foxcaves.utils')
local user_model = require('foxcaves.models.user')
local ngx = ngx

R.register_route(
    '/api/v1/users/byName/{user}',
    'GET',
    R.make_route_opts({ allow_guest = true }),
    function(route_vars)
        local user = user_model.get_by_username(route_vars.user)
        if not user then
            return utils.api_error('User not found', 404)
        end
        if not user:can_view(ngx.ctx.user) then
            return utils.api_error('You do not have permission to view this user', 403)
        end
        return user:get_public()
    end,
    {
        description = 'Get information about a user',
        authorization = { 'anonymous' },
        request = {
            params = {
                user = {
                    type = 'string',
                    description = 'The username of the user',
                },
            },
        },
        response = {
            body = { type = 'user.public' },
        },
    }
)
