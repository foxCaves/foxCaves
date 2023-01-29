local utils = require("foxcaves.utils")
local expiry_utils = require("foxcaves.expiry_utils")
local file_model = require("foxcaves.models.file")
local ngx = ngx
local math_min = math.min
local tonumber = tonumber

R.register_route("/api/v1/files", "POST", R.make_route_opts(), function()
    if not ngx.ctx.user:can_perform_write() then
        return utils.api_error("You cannot create files", 403)
    end

    local name = ngx.var.arg_name

    if not name then
        return utils.api_error("No name")
    end

    local user = ngx.ctx.user

    name = ngx.unescape_uri(name)

    local file = file_model.new()
    file:set_owner(user)
    if not file:set_name(name) or not file:compute_mimetype() then
        return utils.api_error("Invalid name")
    end

    local filesize = tonumber(ngx.req.get_headers()["Content-Length"])

    if not user:has_free_storage_for(filesize) then
        return utils.api_error("Over quota", 402)
    end

    expiry_utils.parse_expiry(ngx.var, file, "arg_")
    file.size = filesize
    file:save()
    local chunk_size = file:upload_begin()

    local remaining = filesize
    local sock = ngx.req.socket()
    sock:settimeout(10000)
    while remaining > 0 do
        local data, _ = sock:receive(math_min(chunk_size, remaining))
        if not data then
            file:upload_abort()
            return utils.api_error("Error receiving data")
        end
        remaining = remaining - data:len()
        file:upload_chunk(data)
    end

    file:upload_finish()
    file:save("create")

    return file:get_private()
end, {
    description = "Uploads a file",
    authorization = {"active"},
    request = {
        query = {
            name = {
                description = "The name of the file",
                type = "string",
                required = true,
            },
            expires_at = {
                type = "string",
                description = "The expiry of the file",
                required = false,
            },
            expires_in = {
                type = "integer",
                description = "The expiry of the file in seconds from now",
                required = false,
            },
        },
        body = {
            type = "raw",
            description = "The file data",
            required = true,
        },
    },
    response = {
        body = {
            type = "file.private",
        },
    },
})
