register_route("/api/v1/files/{id}/convert", "POST", make_route_opts(), function()
	local fileid = ngx.ctx.route_vars.id

	local newextension = ngx.var.arg_newtype:lower()
	if newextension ~= "jpg" and newextension ~= "png" and newextension ~= "gif" and newextension ~= "bmp" then
		return api_error("Bad newtype for convert")
	end
	newextension = "." .. newextension

	local succ, data, dbdata = file_download(fileid, ngx.ctx.user.id)
	if(not succ) or dbdata.extension == newextension or dbdata.type ~= 1 then
		return api_error("File not found or not owned by you")
	end

	local newfilename = dbdata.name
	newfilename = newfilename:sub(1, newfilename:len() - dbdata.extension:len()) .. newextension

	local database = get_ctx_database()

	local fh = io.open("/var/www/foxcaves/tmp/files/" .. fileid .. dbdata.extension, "w")
	fh:write(data)
	fh:close()
	os.execute('/usr/bin/convert "/var/www/foxcaves/tmp/files/' .. fileid .. dbdata.extension .. '" -format ' .. newextension:sub(2) .. ' "/var/www/foxcaves/tmp/files/' .. fileid .. newextension .. '"')
	os.remove("/var/www/foxcaves/tmp/files/" .. fileid .. dbdata.extension)

	local newsize = lfs.attributes("/var/www/foxcaves/tmp/files/" .. fileid .. newextension, "size")
	if not newsize then
		return api_error("Internal error", 500)
	end

	database:query_safe('UPDATE files SET extension = %s, name = %s, size = %s WHERE id = %s', newextension, newfilename, newsize, fileid)
	newsize = newsize - dbdata.size

	file_upload(fileid, newfilename, newextension, "", mimetypes[newextension], nil)
	file_manualdelete(fileid .. "/file" .. dbdata.extension)

	file_push_action('refresh', {
		id = fileid,
		extension = newextension,
		name = newfilename,
		size = newsize,
	})
end)
