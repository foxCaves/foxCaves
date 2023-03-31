local utils = require('foxcaves.utils')
local expiry_utils = require('foxcaves.expiry_utils')
local link_model = require('foxcaves.models.link')
local ngx = ngx

R.register_route(
    '/api/v1/links/{link}',
    'PATCH',
    R.make_route_opts(),
    function(route_vars)
        local link = link_model.get_by_id(route_vars.link)
        if not link then
            return utils.api_error('Link not found', 404)
        end
        if link.owner ~= ngx.ctx.user.id then
            return utils.api_error('Not your link', 403)
        end

        local args = utils.get_post_args()

        expiry_utils.parse_expiry(args, link)

        link:save()
        return link:get_private()
    end,
    {
        description = 'Updates information about a link',
        authorization = { 'owner' },
        request = {
            params = {
                link = {
                    type = 'string',
                    description = 'The id of the link',
                },
            },
            body = {
                type = 'object',
                required = true,
                fields = {
                    expires_at = {
                        type = 'string',
                        description = 'The new expiry of the link',
                        required = false,
                    },
                    expires_in = {
                        type = 'integer',
                        description = 'The new expiry of the link in seconds from now',
                        required = false,
                    },
                },
            },
        },
        response = {
            body = { type = 'link.private' },
        },
    }
)