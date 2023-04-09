local link_model = require('foxcaves.models.link')
local user_model = require('foxcaves.models.user')
local utils = require('foxcaves.utils')
local ngx = ngx
local next = next
local tonumber = tonumber
local table_insert = table.insert

R.register_route(
    '/api/v1/users/{user}/links',
    'GET',
    R.make_route_opts(),
    function(route_vars)
        local user = user_model.get_by_id(route_vars.user)
        if not user then
            return utils.api_error('User not found', 404)
        end
        if not user:can_view_subresources(ngx.ctx.user) then
            return utils.api_error('You are not allowed to list links for this user', 403)
        end

        local query_options = {
            offset = tonumber(ngx.var.arg_offset or '0'),
            limit = tonumber(ngx.var.arg_limit or '0'),
        }
        local items = link_model.get_by_owner(user, query_options)

        local ret = {
            offset = query_options.offset,
            count = #items,
            total = link_model.count_by_owner(user),
            items = utils.make_array(),
        }
        for _, v in next, items do
            table_insert(ret.items, v:get_private())
        end
        return ret
    end,
    {
        description = 'Get a list of links of a user',
        authorization = { 'self' },
        request = {
            query = {
                offset = {
                    description = 'The offset at which to begin listing links',
                    type = 'integer',
                    required = false,
                },
                limit = {
                    description = 'The maximum number of links to list',
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
                type = 'object',
                fields = {
                    offset = {
                        description = 'The offset at which the links were listed',
                        type = 'integer',
                    },
                    count = {
                        description = 'The number of links returned',
                        type = 'integer',
                    },
                    total = {
                        description = 'The total number of links for the given user',
                        type = 'integer',
                    },
                    items = {
                        type = 'array',
                        item_type = 'file.private',
                    },
                },
            },
        },
    }
)