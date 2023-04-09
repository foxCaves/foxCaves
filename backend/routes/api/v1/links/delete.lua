local utils = require('foxcaves.utils')
local link_model = require('foxcaves.models.link')
local ngx = ngx

R.register_route(
    '/api/v1/links/{link}',
    'DELETE',
    R.make_route_opts(),
    function(route_vars)
        local link = link_model.get_by_id(route_vars.link)
        if not link then
            return utils.api_error('Link not found', 404)
        end
        if not link:can_edit(ngx.ctx.user) then
            return utils.api_error('You do not have permission to edit this link', 403)
        end
        link:delete()
        return link:get_private()
    end,
    {
        description = 'Deletes a link',
        authorization = { 'owner' },
        request = {
            params = {
                link = {
                    type = 'string',
                    description = 'The id of the link',
                },
            },
        },
        response = {
            body = { type = 'link.private' },
        },
    }
)