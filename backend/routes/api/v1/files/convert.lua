local lfs = require("lfs")
local utils = require("foxcaves.utils")
local File = require("foxcaves.models.file")
local exec = require("foxcaves.exec")
local ngx = ngx
local os = os

R.register_route("/api/v1/files/{id}/convert", "POST", R.make_route_opts(), function(route_vars)
	local file = File.GetByID(route_vars.id)
	if not file then
		return utils.api_error("Not found", 404)
	end
	if file.user ~= ngx.ctx.user.id then
		return utils.api_error("Not your file", 403)
	end

	if file.type ~= File.Type.Image then
		return utils.api_error("Not an image", 400)
	end

	local args = utils.get_post_args()

	local newextension = args.extension:lower()
	if newextension ~= "jpg" and newextension ~= "png" and newextension ~= "gif" and newextension ~= "bmp" then
		return utils.api_error("Bad extension for convert")
	end
	newextension = "." .. newextension

	local srcfile = file:Download()

	local newfilename = file.name
	newfilename = newfilename:sub(1, newfilename:len() - file.extension:len()) .. newextension

	local tmpfile =  File.Paths.Temp .. "file_new_" .. file.id .. newextension

	exec.cmd("convert", srcfile, "-format", newextension:sub(2), tmpfile)
	os.remove(srcfile)

	local newsize = lfs.attributes(tmpfile, "size")
	if not newsize then
		return utils.api_error("Internal error", 500)
	end

	file:SetName(newfilename)
	file:MoveUploadData(tmpfile)
	file:Save()
	return file
end)
