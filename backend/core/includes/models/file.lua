local FILE_STORAGE_PATH = "/var/www/foxcaves/storage/"

local FileMT = {}

File = {}

FILE_TYPE_OTHER = 0
FILE_TYPE_IMAGE = 1
FILE_TYPE_TEXT = 2
FILE_TYPE_VIDEO = 3
FILE_TYPE_AUDIO = 4
FILE_TYPE_IFRAME = 5

local mimeHandlers = {
    image = function(src, dest)
        local thumbext = ".png"
        local thumbnail = dest .. thumbext
        os.execute(
            string.format(
                '/usr/bin/convert "%s" -thumbnail x300 -resize "300x<" -resize 50%% -gravity center -crop 150x150+0+0 +repage -format png "%s"',
                src,
                thumbnail
            )
        )

        if not lfs.attributes(thumbnail, "size") then
            return FILE_TYPE_IMAGE, nil
        end
        return FILE_TYPE_IMAGE, thumbext
    end,

    text = function(src, dest)
        local fh = io.open(src, "r")
        local content = escape_html(fh:read(4096))

        if fh:read(1) then
            content = content .. "\n<i>[...]</i>"
        end
        fh:close()

        if content:sub(1,3) == "\xef\xbb\xbf" then
            content = content:sub(4)
        end

        fh = io.open(dest .. ".txt", "w")
        fh:write(content)
        fh:close()

        return FILE_TYPE_TEXT, ".txt"
    end,

    video = function()
        return FILE_TYPE_VIDEO, nil
    end,

    audio = function()
        return FILE_TYPE_AUDIO, nil
    end,

    application = function(src, dest, suffix)
        if suffix == "pdf" then
            return FILE_TYPE_IFRAME, nil
        end
        return FILE_TYPE_OTHER, nil
    end
}

local function file_fullread(filename)
	local fh = io.open(filename, "r")
	if not fh then return "" end
	local cont = fh:read("*all")
	fh:close()
	return cont
end

function File.ManualDelete(file, isdir)
	if isdir then
		lfs.rmdir(FILE_STORAGE_PATH .. file)
	else
		os.remove(FILE_STORAGE_PATH .. file)
	end
end

local function file_move(src, dst)
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

local function makefilemt(file)
    file.not_in_db = nil
    setmetatable(file, FileMT)
    file:ComputeVirtuals()
    return file
end

function File.GetByUser(user)
    if user.id then
        user = user.id
    end

    local files = get_ctx_database():query_safe('SELECT * FROM files WHERE "user" = %s', user)
    for k,v in pairs(files) do
        files[k] = makefilemt(v)
    end
    return files
end

function File.GetByID(id)
	if not id then 
		return nil
	end

	local file = get_ctx_database():query_safe('SELECT * FROM files WHERE id = %s', id)
	file = file[1]

	if not file then
		return nil
	end

	return makefilemt(file)
end

function File.New()
    local file = {
        not_in_db = true,
        id = randstr(10),
    }
    setmetatable(file, FileMT)
    return file
end

function FileMT:ComputeVirtuals()
    if self.thumbnail and self.thumbnail ~= "" then
		self.thumbnail_url = SHORT_URL .. "/thumbs/" .. self.id .. self.thumbnail
	end
	if self.type == FILE_TYPE_IMAGE and self.thumbnail_url then
		self.thumbnail_image = self.thumbnail_url
	else
		self.thumbnail_image = MAIN_URL .. "/static/img/thumbs/ext_" .. self.extension .. ".png"
	end

	self.view_url = SHORT_URL .. "/v" .. self.id
	self.direct_url = SHORT_URL .. "/f" .. self.id .. self.extension
	self.download_url = SHORT_URL .. "/d" .. self.id .. self.extension
	self.mimetype = mimetypes[self.extension] or "application/octet-stream"
end

function FileMT:Delete()
	File.ManualDelete(self.id .. "/file" .. self.extension)
	if self.thumbnail and self.thumbnail ~= "" then
		File.ManualDelete(self.id .. "/thumb" .. self.thumbnail)
	end
	File.ManualDelete(self.id, true)

	get_ctx_database():query_safe('DELETE FROM files WHERE id = %s', self.id)

	raw_push_action('file:delete', {
        file = {
            id = self.user
        }
    })
end

function FileMT:Download()
    return file_fullread(FILE_STORAGE_PATH .. self.id .. "/file" .. self.extension)
end

function FileMT:SetName(name)
	local nameregex = ngx.re.match(src, "^([^<>\r\n\t]*?)(\\.[a-zA-Z0-9]+)?$", "o")

    if (not nameregex) or (not nameregex[1]) then
        return false
    end

    self.name = nameregex[1]
    self.extension = nameregex[2]
    if not self.extension then
        self.extension = ".bin"
    else
        self.extension = self.extension:lower()
    end

    return true
end

function FileMT:MoveUploadData(src)
    self.size = lfs.attributes(src, "size")

    self:ComputeVirtuals()

    local thumbDest = "/var/www/foxcaves/tmp/thumbs/" .. self.id
    
	local prefix, suffix = self.mimetype:match("([a-z]+)/([a-z]+)")
	self.type, self.thumbnail = mimeHandlers[prefix](src, thumbDest, suffix)

	lfs.mkdir(FILE_STORAGE_PATH .. self.id)

	file_move(src, FILE_STORAGE_PATH .. self.id .. "/file" .. self.extension)

	if self.thumbnail and self.thumbnail ~= "" then
		file_move(thumbDest .. self.thumbnail, FILE_STORAGE_PATH .. self.id .. "/thumb" .. self.thumbnail)
	end

    self:ComputeVirtuals()
end

function FileMT:Save()
    local primary_push_action
    if self.not_in_db then
        get_ctx_database():query_safe('INSERT INTO files (id, name, "user", extension, type, size, time, thumbnail) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)', self.id, self.name, self.user, self.extension, self.type, self.size, self.time, self.thumbnail or "")
        primary_push_action = 'create'
        self.not_in_db = nil
    else
        get_ctx_database():query_safe('UPDATE files SET name = %s, "user" = %s, extension = %s, type = %s, size = %s, time = %s, thumbnail = %s WHERE id = %s', self.name, self.user, self.extension, self.type, self.size, self.time, self.thumbnail or "", self.id)
        primary_push_action = 'refresh'
    end
	raw_push_action({
		action = "file:" .. primary_push_action,
		file = self,
	}, self.user)
	raw_push_action({
		action = "usedbytes",
		usedbytes = user_calculate_usedbytes(self.user),
	}, self.user)
end

FileMT.__index = FileMT
