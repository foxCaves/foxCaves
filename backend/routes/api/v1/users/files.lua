local file_model = require('foxcaves.models.file')
local user_model = require('foxcaves.models.user')
local utils = require('foxcaves.utils')
local ngx = ngx
local next = next
local tonumber = tonumber

R.register_route(
    '/api/v1/users/{user}/files',
    'GET',
    R.make_route_opts({ empty_is_array = true }),
    function(route_vars)
        local user = user_model.get_by_id(route_vars.user)
        if not user then
            return utils.api_error('User not found', 404)
        end
        if user.id ~= ngx.ctx.user.id then
            return utils.api_error('You are not list files for this user', 403)
        end

        local res = file_model.get_by_owner(user, {
            offset = tonumber(ngx.var.arg_offset or '0'),
            limit = tonumber(ngx.var.arg_limit or '0'),
        })
        for k, v in next, res do
            res[k] = v:get_private()
        end
        return res
    end,
    {
        description = 'Get a list of files of a user',
        authorization = { 'self' },
        request = {
            query = {
                offset = {
                    description = 'The offset at which to begin listing files',
                    type = 'integer',
                    required = false,
                },
                limit = {
                    description = 'The maximum number of files to list',
                    type = 'integer',
                    required = false,
                },
            },
            params = {
                user = {
                    description = 'The id of the user',
                    type = 'uuid',
                },
            },
        },
        response = {
            body = {
                type = 'array',
                items = { type = 'file.private' },
            },
        },
    }
)