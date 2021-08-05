local FILE_STORAGE_PATH = "/var/www/foxcaves/storage/"

FILE_TYPE_OTHER = 0
FILE_TYPE_IMAGE = 1
FILE_TYPE_TEXT = 2
FILE_TYPE_VIDEO = 3
FILE_TYPE_AUDIO = 4
FILE_TYPE_IFRAME = 5

local function file_fullread(filename)
	local fh = io.open(filename, "r")
	if not fh then return "" end
	local cont = fh:read("*all")
	fh:close()
	return cont
end

function file_get(fileid, user)
	if not fileid then 
		return nil
	end
	
	local file
	if fileid.id then
		file = fileid
		fileid = file.id
	else
		file = ngx.ctx.database:query_safe('SELECT * FROM files WHERE id = %s', fileid)
		file = file[1]
	end
	
	if not file then
		return nil
	end

	if user and file.user ~= user then
		return nil
	end

	if file.thumbnail then
		file.thumbnail_url = SHORT_URL .. "/thumbs/" .. file.id .. file.thumbnail
	end
	if file.type == FILE_TYPE_IMAGE and file.thumbnail_url then
		file.thumbnail_image = file.thumbnail_url
	else
		file.thumbnail_image = MAIN_URL .. "/static/img/thumbs/ext_" .. file.extension .. ".png"
	end
	file.thumbnail = nil
	file.view_url = SHORT_URL .. "/v" .. file.id
	file.direct_url = SHORT_URL .. "/f" .. file.id .. file.extension
	file.download_url = SHORT_URL .. "/d" .. file.id .. file.extension
	file.mimetype = mimetypes[file.extension] or "application/octet-stream"

	return file
end

function file_manualdelete(file, isdir)
	if isdir then
		lfs.rmdir(FILE_STORAGE_PATH .. file)
	else
		os.remove(FILE_STORAGE_PATH .. file)
	end
end

function file_delete(fileid, user)
	local file = file_get(fileid, user)
	if not file then
		return false
	end

	file_manualdelete(fileid .. "/file" .. file.extension)
	if file.thumbnail and file.thumbnail ~= "" then
		file_manualdelete(fileid .. "/thumb" .. file.thumbnail)
	end
	file_manualdelete(fileid, true)

	ngx.ctx.database:query_safe('DELETE FROM files WHERE id = %s', fileid)

	if file.user and file.user == ngx.ctx.user.id then
		ngx.ctx.user.usedbytes = ngx.ctx.user.usedbytes - file.size
	end
	file_push_action('delete', file, { id = file.user })

	return true, file.name
end

function file_download(fileid, user)
	local file = file_get(fileid, user)
	if not file then return false end

	return true, file_fullread(FILE_STORAGE_PATH .. fileid .. "/file" .. file.extension), file
end

function file_move(src, dst)
	local fhsrc = io.open(src, "rb")
	local fhdst = io.open(dst, "wb")

	while true do
		local buffer = fhsrc:read(4096)
		if not buffer then break end
		fhdst:write(buffer)
	end

	fhsrc:close()
	fhdst:close()

	os.remove(src)
end

function file_upload(fileid, filename, extension, thumbnail, filetype, thumbtype)
	lfs.mkdir(FILE_STORAGE_PATH .. fileid)

	file_move("/var/www/foxcaves/tmp/files/" .. fileid .. extension, FILE_STORAGE_PATH .. fileid .. "/file" .. extension)

	if thumbnail and thumbnail ~= "" then
		file_move("/var/www/foxcaves/tmp/thumbs/" .. fileid .. thumbnail, FILE_STORAGE_PATH .. fileid .. "/thumb" .. thumbnail)
	end
end

function file_push_action(action, file, userdata)
	raw_push_action({
		action = "file:" .. action,
		file = file,
	}, userdata)
	if (not userdata) or userdata == ngx.ctx.user then
		raw_push_action({
			action = "usedbytes",
			usedbytes = ngx.ctx.user.usedbytes,
		}, userdata)
	end
end
