local utils = require('foxcaves.utils')
local user_model = require('foxcaves.models.user')
local ngx = ngx

local function convert_user_id(id)
    if id == 'self' then
        return ngx.ctx.user and ngx.ctx.user.id
    end
    return id
end

R.register_route(
    '/api/v1/users/{user}',
    'GET',
    R.make_route_opts({ allow_guest = true }),
    function(route_vars)
        local user = user_model.get_by_id(convert_user_id(route_vars.user))
        if not user then
            return utils.api_error('User not found', 404)
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
                    description = 'The id of the user (or the string "self")',
                },
            },
        },
        response = {
            body = { type = 'user.public' },
        },
    }
)

R.register_route(
    '/api/v1/users/{user}/details',
    'GET',
    R.make_route_opts(),
    function(route_vars)
        local user = user_model.get_by_id(convert_user_id(route_vars.user))
        if not user then
            return utils.api_error('User not found', 404)
        end
        if user.id ~= ngx.ctx.user.id then
            return utils.api_error("You do not have permission to view this user's details", 403)
        end
        return user:get_private()
    end,
    {
        description = 'Get detailed information about a user',
        authorization = { 'self' },
        request = {
            params = {
                user = {
                    type = 'uuid',
                    description = 'The id of the user (or the string "self")',
                },
            },
        },
        response = {
            body = { type = 'user.private' },
        },
    }
)