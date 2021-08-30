local lfs = require("lfs")
local utils = require("foxcaves.utils")
local file_model = require("foxcaves.models.file")
local exec = require("foxcaves.exec")
local ngx = ngx
local os = os

R.register_route("/api/v1/files/{id}/convert", "POST", R.make_route_opts(), function(route_vars)
    if not ngx.ctx.user:can_perform_write() then
        return utils.api_error("You cannot create files", 403)
    end

    local file = file_model.get_by_id(route_vars.id)
    if not file then
        return utils.api_error("File not found", 404)
    end
    if file.user ~= ngx.ctx.user.id then
        return utils.api_error("Not your file", 403)
    end

    if file.mimetype:sub(1, 6) ~= "image/" then
        return utils.api_error("Not an image", 400)
    end

    local args = utils.get_post_args()

    local newextension = args.extension:lower()
    if newextension ~= "jpg" and newextension ~= "png" and newextension ~= "gif" and newextension ~= "bmp" then
        return utils.api_error("Bad extension for convert")
    end

    local srcfile = file:make_local_path()

    local newfilename = file.name
    newfilename = newfilename:sub(1, newfilename:len() - file:get_extension():len()) .. "." .. newextension

    local tmpfile =  file_model.paths.temp .. "file_new_" .. file.id .. "." .. newextension

    exec.cmd("convert", srcfile, "-format", newextension, tmpfile)
    os.remove(srcfile)

    local newsize = lfs.attributes(tmpfile, "size")
    if not newsize then
        return utils.api_error("Internal error", 500)
    end

    file:set_name(newfilename)
    file:move_upload_data(tmpfile)
    file:save()
    return file:get_private()
end)
