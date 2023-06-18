local utils = require('foxcaves.utils')
local expiry_utils = require('foxcaves.expiry_utils')
local file_model = require('foxcaves.models.file')
local ngx = ngx
local tonumber = tonumber

R.register_route(
    '/api/v1/files',
    'POST',
    R.make_route_opts(),
    function()
        if not ngx.ctx.user:can_perform_write() then
            return utils.api_error('You cannot create files', 403)
        end

        local name = ngx.var.arg_name

        if not name then
            return utils.api_error('No name')
        end

        local user = ngx.ctx.user

        name = ngx.unescape_uri(name)

        local file = file_model.new()
        file:set_owner(user)
        if not file:set_name(name) then
            return utils.api_error('Invalid name')
        end

        local filesize = tonumber(ngx.req.get_headers()['Content-Length'])
        if filesize < 1 then
            return utils.api_error('Invalid Content-Length', 400)
        end
        if not user:has_free_storage_for(filesize) then
            return utils.api_error('Over quota', 402)
        end

        expiry_utils.parse_expiry(ngx.var, file, 'arg_')
        file.size = filesize

        if ngx.var.arg_storage and ngx.ctx.user:is_admin() then
            file.storage = ngx.var.arg_storage
        end

        file:save()
        file:upload_begin()

        local sock = ngx.req.socket()
        sock:settimeout(10000)
        local res = file:upload_from_callback(function(size)
            return sock:receive(size)
        end)

        if not res then
            file:upload_abort()
            file:delete()
            return utils.api_error('Upload failed', 500)
        end

        file:upload_finish()
        file:save('create')

        return file:get_private()
    end,
    {
        description = 'Uploads a file',
        authorization = { 'active' },
        request = {
            query = {
                name = {
                    description = 'The name of the file',
                    type = 'string',
                    required = true,
                },
                expires_at = {
                    type = 'string',
                    description = 'The expiry of the file',
                    required = false,
                },
                expires_in = {
                    type = 'integer',
                    description = 'The expiry of the file in seconds from now',
                    required = false,
                },
                storage = {
                    type = 'string',
                    description = 'The storage of the file (admin only)',
                    required = false,
                },
            },
            body = {
                type = 'raw',
                description = 'The file data',
                required = true,
            },
        },
        response = {
            body = { type = 'file.private' },
        },
    }
)
