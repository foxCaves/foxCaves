local lfs = require("lfs")

dofile("mimetypes.lua")

local FILE_STORAGE_PATH = "/var/www/foxcaves/storage/"
local database = ngx.ctx.database

local function file_fullread(filename)
	local fh = io.open(filename, "r")
	if not fh then return "" end
	local cont = fh:read("*all")
	fh:close()
	return cont
end

function file_get(fileid, user)
	if not fileid then return nil end
	local file = database:hgetall(database.KEYS.FILES .. fileid)
	if (not file) or (file == ngx.null) or (not file.name) then return nil end
	file.user = tonumber(file.user)
	if user and file.user ~= user then return nil end
	file.type = tonumber(file.type)
	file.time = tonumber(file.time)
	file.size = tonumber(file.size)
	file.id = fileid
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
	file.mimetype = MIMETYPES[file.extension] or "application/octet-stream"
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
	if not file then return false end

	file_manualdelete(fileid .. "/file" .. file.extension)
	if file.thumbnail and file.thumbnail ~= "" then
		file_manualdelete(fileid .. "/thumb" .. file.thumbnail)
	end
	file_manualdelete(fileid, true)

	database:zrem(database.KEYS.USER_FILES .. file.user, fileid)
	database:del(database.KEYS.FILES .. fileid)

	if file.user then
		database:hincrby(database.KEYS.USERS .. file.user, "usedbytes", -file.size)
		if file.user == ngx.ctx.user.id then
			ngx.ctx.user.usedbytes = ngx.ctx.user.usedbytes - file.size
			file_push_action('delete', file)
		end
	end

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

function file_push_action(action, file)
	raw_push_action({
		action = "file:" .. action,
		file = file,
	})
	raw_push_action({
		action = "usedbytes",
		usedbytes = ngx.ctx.user.usedbytes,
	})
end
