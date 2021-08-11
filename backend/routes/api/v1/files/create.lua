local lfs = require("lfs")
local utils = require("foxcaves.utils")
local File = require("foxcaves.models.file")
local ngx = ngx
local io = io

register_route("/api/v1/files", "POST", make_route_opts(), function()
	local name = ngx.var.arg_name

	if not name then
		return utils.api_error("No name")
	end

	name = ngx.unescape_uri(name)

	local file = File.New()
	file:SetOwner(ngx.ctx.user)
	if not file:SetName(name) then
		return utils.api_error("Invalid name")
	end

	ngx.req.read_body()
	local filetmp = ngx.req.get_body_file()
	local filedata = ngx.req.get_body_data()
	if (not filetmp) and (not filedata) then
		return utils.api_error("No body")
	end

	local filesize = filetmp and lfs.attributes(filetmp, "size") or filedata:len()
	if (not filesize) or filesize <= 0 then
		return utils.api_error("Empty body")
	end

	if ngx.ctx.user:CalculateUsedBytes() + filesize > ngx.ctx.user.totalbytes then
		return utils.api_error("Over quota", 402)
	end

	if not filetmp then
		filetmp = "../tmp/files/" .. file.id .. file.extension
		f = io.open(filetmp, "wb")
		f:write(filedata)
		f:close()
		filedata = nil
	end
	file:MoveUploadData(filetmp)

	file:Save()

	return file
end)
