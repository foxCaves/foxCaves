local utils = require('foxcaves.utils')
local file_model = require('foxcaves.models.file')
local ngx = ngx

R.register_route(
    '/api/v1/files/{file}',
    'DELETE',
    R.make_route_opts(),
    function(route_vars)
        local file = file_model.get_by_id(route_vars.file)
        if not file then
            return utils.api_error('Not found', 404)
        end
        if file.owner ~= ngx.ctx.user.id then
            return utils.api_error('Not your file', 403)
        end
        file:delete()
        return file:get_private()
    end,
    {
        description = 'Deletes a file',
        authorization = { 'owner' },
        request = {
            params = {
                file = {
                    type = 'string',
                    description = 'The id of the file',
                },
            },
        },
        response = {
            body = { type = 'file.private' },
        },
    }
)