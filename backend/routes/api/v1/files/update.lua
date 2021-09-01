local utils = require("foxcaves.utils")
local file_model = require("foxcaves.models.file")
local ngx = ngx

R.register_route("/api/v1/files/{id}", "PATCH", R.make_route_opts(), function(route_vars)
    if not ngx.ctx.user:can_perform_write() then
        return utils.api_error("You cannot update files", 403)
    end

    local file = file_model.get_by_id(route_vars.id)
    if not file then
        return utils.api_error("File not found", 404)
    end
    if file.user ~= ngx.ctx.user.id then
        return utils.api_error("Not your file", 403)
    end

    local args = utils.get_post_args()

    if args.name then
        local newname = args.name
        local n, newext = file_model.extract_name_and_extension(newname)
        if not n then
            return utils.api_error("Invalid file name")
        end
        local ext = file:get_extension()
        if ext ~= newext then
            return utils.api_error("Extension mismatch")
        end
        file.name = newname
    end

    file:save()
    return file:get_private()
end, {
    description = "Updates information about a file",
    request = {
        params = {
            id = {
                type = "string",
                description = "The id of the file"
            },
        },
        body = {
            type = "object",
            required = true,
            fields = {
                name = {
                    type = "string",
                    description = "The new name of the file",
                    required = false,
                },
            },
        },
    },
    response = {
        body = {
            type = "file.private",
        },
    },
})
