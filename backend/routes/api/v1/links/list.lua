local link_model = require('foxcaves.models.link')
local utils = require('foxcaves.utils')
local ngx = ngx
local next = next
local tonumber = tonumber
local table_insert = table.insert

R.register_route(
    '/api/v1/links',
    'GET',
    R.make_route_opts_admin(),
    function()
        local query_options = {
            offset = tonumber(ngx.var.arg_offset or '0'),
            limit = tonumber(ngx.var.arg_limit or '0'),
        }

        local query = '1 = 1'

        local items = link_model.get_by_query(query, query_options)

        local ret = {
            offset = query_options.offset,
            count = #items,
            total = link_model.count_by_query(query),
            items = utils.make_array(),
        }
        for _, v in next, items do
            table_insert(ret.items, v:get_public())
        end
        return ret
    end,
    {
        description = 'Get a list of links',
        authorization = { 'admin' },
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
                        description = 'The total number of links',
                        type = 'integer',
                    },
                    items = {
                        type = 'array',
                        item_type = 'link.public',
                    },
                },
            },
        },
    }
)
