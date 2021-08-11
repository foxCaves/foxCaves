register_route("/api/v1/files", "POST", make_route_opts(), function()
	local database = get_ctx_database()

	local name = ngx.var.arg_name

	if not name then
		return api_error("No name")
	end

	name = ngx.unescape_uri(name)

	ngx.req.read_body()
	local filetmp = ngx.req.get_body_file()
	local filedata = ngx.req.get_body_data()
	if (not filetmp) and (not filedata) then
		return api_error("No body")
	end

	local filesize = filetmp and lfs.attributes(filetmp, "size") or filedata:len()
	if (not filesize) or filesize <= 0 then
		return api_error("Empty body")
	end

	if user_calculate_usedbytes(ngx.ctx.user) + filesize > ngx.ctx.user.totalbytes then
		return api_error("Over quota", 402)
	end

	local file = File.New()
	file.user = ngx.ctx.user.id

	if not filetmp then
		filemtp = "/var/www/foxcaves/tmp/files/" .. file.id .. extension
		f = io.open(filemtp, "wb")
		f:write(filedata)
		f:close()
		filedata = nil
	end
	file:MoveUploadData(filemtp)

	file:Save()

	return file
end)
