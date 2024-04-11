local user_model = require('foxcaves.models.user')
local utils = require('foxcaves.utils')
local ngx = ngx
local next = next
local tonumber = tonumber
local table_insert = table.insert

R.register_route('/api/v1/users', 'GET', R.make_route_opts_admin(), function()
    local query_options = {
        offset = tonumber(ngx.var.arg_offset or '0'),
        limit = tonumber(ngx.var.arg_limit or '0')
    }

    local query = 'active = 1'
    if ngx.var.arg_approval_queue then
        query = query .. ' AND approved = 0'
    end

    local items = user_model.get_by_query(query, query_options)

    local ret = {
        offset = query_options.offset,
        count = #items,
        total = user_model.count_by_query(query),
        items = utils.make_array()
    }
    for _, v in next, items do
        table_insert(ret.items, v:get_public())
    end
    return ret
end, {
    description = 'Get a list of users',
    authorization = {'admin'},
    request = {
        query = {
            offset = {
                description = 'The offset at which to begin listing users',
                type = 'integer',
                required = false
            },
            limit = {
                description = 'The maximum number of users to list',
                type = 'integer',
                required = false
            }
        }
    },
    response = {
        body = {
            type = 'object',
            fields = {
                offset = {
                    description = 'The offset at which the users were listed',
                    type = 'integer'
                },
                count = {
                    description = 'The number of users returned',
                    type = 'integer'
                },
                total = {
                    description = 'The total number of users',
                    type = 'integer'
                },
                items = {
                    type = 'array',
                    item_type = 'user.public'
                }
            }
        }
    }
})
