local utils = require('foxcaves.utils')
local expiry_utils = require('foxcaves.expiry_utils')
local file_model = require('foxcaves.models.file')
local ngx = ngx

R.register_route(
    '/api/v1/files/{file}',
    'PATCH',
    R.make_route_opts(),
    function(route_vars)
        local file = file_model.get_by_id(route_vars.file)
        if not file then
            return utils.api_error('File not found', 404)
        end
        if not file:can_edit(ngx.ctx.user) then
            return utils.api_error('You do not have permission to edit this file', 403)
        end

        local args = utils.get_post_args()

        if args.name and not file:set_name(args.name) then
            return utils.api_error('Invalid name')
        end

        expiry_utils.parse_expiry(args, file)

        file:save()

        if args.storage and ngx.ctx.user:is_admin() then
            file:migrate(args.storage)
        end

        return file:get_private()
    end,
    {
        description = 'Updates information about a file',
        authorization = { 'owner' },
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
                    name = {
                        type = 'string',
                        description = 'The new name of the file',
                        required = false,
                    },
                    expires_at = {
                        type = 'string',
                        description = 'The new expiry of the file',
                        required = false,
                    },
                    expires_in = {
                        type = 'integer',
                        description = 'The new expiry of the file in seconds from now',
                        required = false,
                    },
                    storage = {
                        type = 'string',
                        description = 'The new storage of the file (admin only)',
                        required = false,
                    },
                },
            },
        },
        response = {
            body = { type = 'file.private' },
        },
    }
)
