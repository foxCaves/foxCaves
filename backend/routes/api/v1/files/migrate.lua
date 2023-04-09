local utils = require('foxcaves.utils')
local file_model = require('foxcaves.models.file')

R.register_route(
    '/api/v1/files/{file}/migrate',
    'POST',
    R.make_route_opts_admin(),
    function(route_vars)
        local file = file_model.get_by_id(route_vars.file)
        if not file then
            return utils.api_error('File not found', 404)
        end
        if not file:can_edit(ngx.ctx.user) then
            return utils.api_error('You do not have permission to edit this file', 403)
        end

        local args = utils.get_post_args()

        if not args.target then
            return utils.api_error('Missing target')
        end

        file:migrate(args.target)
        return file:get_private()
    end,
    {
        description = 'Updates information about a file',
        authorization = { 'admin' },
        request = {
            params = {
                file = {
                    type = 'string',
                    description = 'The id of the file',
                },
            },
            body = {
                type = 'object',
                required = true,
                fields = {
                    target = {
                        type = 'string',
                        description = 'The new storage of the file',
                        required = true,
                    },
                },
            },
        },
        response = {
            body = { type = 'file.private' },
        },
    }
)