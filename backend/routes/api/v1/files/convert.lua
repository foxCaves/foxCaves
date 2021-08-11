local lfs = require("lfs")
local utils = require("foxcaves.utils")
local File = require("foxcaves.models.file")
local ngx = ngx
local io = io

register_route("/api/v1/files/{id}/convert", "POST", make_route_opts(), function()
	local file = File.GetByID(ngx.ctx.route_vars.id)
	if not file then
		return utils.api_error("Not found", 404)
	end
	if file.user ~= ngx.ctx.user.id then
		return utils.api_error("Not your file", 403)
	end

	local newextension = ngx.var.arg_newtype:lower()
	if newextension ~= "jpg" and newextension ~= "png" and newextension ~= "gif" and newextension ~= "bmp" then
		return utils.api_error("Bad newtype for convert")
	end
	newextension = "." .. newextension

	local data = file:Download()

	local newfilename = file.name
	newfilename = newfilename:sub(1, newfilename:len() - file.extension:len()) .. newextension

	local tmptmpfile = "/var/www/foxcaves/tmp/files/original_" .. file.id .. file.extension
	local tmpfile = "/var/www/foxcaves/tmp/files/new_" .. file.id .. newextension

	local fh = io.open(tmptmpfile, "w")
	fh:write(data)
	fh:close()
	os.execute('/usr/bin/convert "' .. tmptmpfile .. '" -format ' .. newextension:sub(2) .. ' "' .. tmpfile .. '"')
	os.remove(tmptmpfile)

	local newsize = lfs.attributes(tmpfile, "size")
	if not newsize then
		return utils.api_error("Internal error", 500)
	end

	file:SetName(newfilename)
	file:MoveUploadData(tmpfile)
	file:Save()
end)
