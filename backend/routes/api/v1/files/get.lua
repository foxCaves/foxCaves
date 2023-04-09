local utils = require('foxcaves.utils')
local file_model = require('foxcaves.models.file')

R.register_route(
    '/api/v1/files/{file}',
    'GET',
    R.make_route_opts_anon(),
    function(route_vars)
        local file = file_model.get_by_id(route_vars.file)
        if not file then
            return utils.api_error('File not found', 404)
        end
        if not file:can_view(ngx.ctx.user) then
            return utils.api_error('You do not have permission to view this file', 403)
        end
        return file:get_public()
    end,
    {
        description = 'Get information about a file',
        authorization = { 'anonymous' },
        request = {
            params = {
                file = {
                    type = 'string',
                    description = 'The id of the file',
                },
            },
        },
        response = {
            body = { type = 'file.public' },
        },
    }
)