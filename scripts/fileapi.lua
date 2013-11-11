local lfs = require("lfs")

if not ngx then
	lfs.chdir(ngx.var.main_root .. "")
end

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
	if user and file.user ~= user then return nil end
	file.type = tonumber(file.type)
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
			file_push_action(fileid, '-')
		end
	end

	return true, file.name
end

function file_download(fileid, user)
	local file = file_get(fileid, user)
	if not file then return false end

	return true, file_fullread(FILE_STORAGE_PATH .. fileid .. "/file" .. file.extension), file
end

function file_upload(fileid, filename, extension, thumbnail, filetype, thumbtype)
	lfs.mkdir(FILE_STORAGE_PATH .. fileid)

	--os.rename("files/" .. fileid .. extension, FILE_STORAGE_PATH .. fileid .. "/file" .. extension)
	os.execute("mv \"files/" .. fileid .. extension .. "\" \"" .. FILE_STORAGE_PATH .. fileid .. "/file" .. extension .. "\"")

	if thumbnail and thumbnail ~= "" then
		--os.rename("thumbs/" .. fileid .. thumbnail, FILE_STORAGE_PATH .. fileid .. "/thumb" .. thumbnail)
		os.execute("mv \"thumbs/" .. fileid .. thumbnail .. "\" \"" .. FILE_STORAGE_PATH .. fileid .. "/thumb" .. thumbnail .. "\"")
	end
end

function file_push_action(fileid, action)
	action = action or '='
	raw_push_action(action .. fileid .. '|U' .. tostring(ngx.ctx.user.usedbytes))
end
