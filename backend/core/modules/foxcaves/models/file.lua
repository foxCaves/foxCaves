local lfs = require("lfs")
local path = require("path")
local utils = require("foxcaves.utils")
local database = require("foxcaves.database")
local events = require("foxcaves.events")
local random = require("foxcaves.random")
local User = require("foxcaves.models.user")
local url_config = require("foxcaves.config").urls
local ROOT = require("foxcaves.consts").ROOT
local exec = require("foxcaves.exec")

local io = io
local os = os
local ngx = ngx
local next = next
local setmetatable = setmetatable

local FileMT = {}

local File = {
    Type = {
        Other = 0,
        Image = 1,
        Text = 2,
        Video = 3,
        Audio = 4,
        Iframe = 5,
    },
    Paths = {
        Storage = path.abs(ROOT .. "/storage/"),
        Temp = path.abs(ROOT .. "/tmp/"),
    }
}

require("foxcaves.module_helper").setmodenv()

local mimetypes = {
	[".bmp"] = "image/bmp",
	[".c"] = "text/plain",
	[".cpp"] = "text/plain",
	[".cs"] = "text/plain",
	[".css"] = "text/css",
	[".flac"] = "audio/flac",
	[".gif"] = "image/gif",
	[".h"] = "text/plain",
	[".htaccess"] = "text/plain",
	[".htm"] = "text/html",
	[".html"] = "text/html",
	[".java"] = "text/plain",
	[".jpeg"] = "image/jpeg",
	[".jpg"] = "image/jpeg",
	[".js"] = "text/javascript",
	[".lua"] = "text/plain",
	[".mp3"] = "audio/mpeg",
	[".mp4"] = "video/mp4",
	[".ogg"] = "audio/ogg",
	[".pdf"] = "application/pdf",
	[".php"] = "text/plain",
	[".php3"] = "text/plain",
	[".php4"] = "text/plain",
	[".php5"] = "text/plain",
	[".php6"] = "text/plain",
	[".phtm"] = "text/plain",
	[".phtml"] = "text/plain",
	[".pl"] = "text/plain",
	[".png"] = "image/png",
	[".py"] = "text/plain",
	[".shtm"] = "text/html",
	[".shtml"] = "text/html",
	[".txt"] = "text/plain",
	[".vb"] = "text/plain",
	[".wav"] = "audio/wav",
	[".webm"] = "video/webm",
}

local mimeHandlers = {
    image = function(src, dest)
        local thumbext = ".png"
        local thumbnail = dest .. thumbext
        exec.cmd(
            "convert", src,
            "-thumbnail", "x300", "-resize", "300x<",
            "-resize", "50%", "-gravity", "center", "-crop", "150x150+0+0",
            "+repage", "-format", "png", thumbnail
        )
        if not lfs.attributes(thumbnail, "size") then
            return File.Type.Image, nil
        end
        return File.Type.Image, thumbext
    end,

    text = function(src, dest)
        local fh = io.open(src, "r")
        local content = utils.escape_html(fh:read(4096))

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

        return File.Type.Text, ".txt"
    end,

    video = function()
        return File.Type.Video, nil
    end,

    audio = function()
        return File.Type.Audio, nil
    end,

    application = function(_, _, suffix)
        if suffix == "pdf" then
            return File.Type.Iframe, nil
        end
        return File.Type.Other, nil
    end
}

local function file_fullread(filename)
	local fh = io.open(filename, "r")
	if not fh then return "" end
	local cont = fh:read("*all")
	fh:close()
	return cont
end

local function file_move(src, dst)
    exec.cmd("mv", src, dst)
end

local function makefilemt(file)
    file.not_in_db = nil
    setmetatable(file, FileMT)
    file:ComputeVirtuals()
    return file
end

local function file_manualdelete(file, isdir)
	if isdir then
		lfs.rmdir(File.Paths.Storage .. file)
	else
		os.remove(File.Paths.Storage .. file)
	end
end

local function file_deletestorage(file)
	file_manualdelete(file.id .. "/file" .. file.extension)
	if file.thumbnail and file.thumbnail ~= "" then
		file_manualdelete(file.id .. "/thumb" .. file.thumbnail)
	end
	file_manualdelete(file.id, true)
end

local file_select = 'id, name, "user", extension, type, size, thumbnail, ' .. database.TIME_COLUMNS

function File.GetByUser(user)
    if user.id then
        user = user.id
    end

    local files = database.get_shared():query_safe('SELECT ' .. file_select .. ' FROM files WHERE "user" = %s', user)
    for k,v in next, files do
        files[k] = makefilemt(v)
    end
    return files
end

function File.GetByID(id)
	if not id then
		return nil
	end

	local file = database.get_shared():query_safe_single('SELECT ' .. file_select .. ' FROM files WHERE id = %s', id)

	if not file then
		return nil
	end

	return makefilemt(file)
end

function File.New()
    local file = {
        not_in_db = true,
        id = random.string(10),
    }
    setmetatable(file, FileMT)
    return file
end

function FileMT:ComputeVirtuals()
    if self.thumbnail and self.thumbnail ~= "" then
		self.thumbnail_url = url_config.short .. "/thumbs/" .. self.id .. self.thumbnail
	end
	if self.type == File.Type.Image and self.thumbnail_url then
		self.thumbnail_image = self.thumbnail_url
	else
		self.thumbnail_image = url_config.main .. "/static/img/thumbs/ext_" .. self.extension .. ".png"
	end

	self.view_url = url_config.short .. "/v" .. self.id
	self.direct_url = url_config.short .. "/f" .. self.id .. self.extension
	self.download_url = url_config.short .. "/d" .. self.id .. self.extension
	self.mimetype = mimetypes[self.extension] or "application/octet-stream"
end

function FileMT:Delete()
    file_deletestorage(self)

	database.get_shared():query_safe('DELETE FROM files WHERE id = %s', self.id)

	events.push_raw({
        action = 'file:delete',
        file = self
    }, self.user)
end

function FileMT:Download()
    return file_fullread(File.Paths.Storage .. self.id .. "/file" .. self.extension)
end

function FileMT:SetOwner(user)
    self.user = user.id or user
end

function FileMT:SetName(name)
	local nameregex = ngx.re.match(name, "^([^<>\r\n\t]*?)(\\.[a-zA-Z0-9]+)?$", "o")

    if (not nameregex) or (not nameregex[1]) then
        return false
    end

    local newextension = (nameregex[2] or ".bin"):lower()

    if self.extension and self.extension ~= newextension then
        file_deletestorage(self)
    end

    self.name = name
    self.extension = newextension

    self:ComputeVirtuals()

    return true
end

function FileMT:MoveUploadData(src)
    self.size = lfs.attributes(src, "size")

    local thumbDest = File.Paths.Temp .. "thumb_" .. self.id

	local prefix, suffix = self.mimetype:match("([a-z]+)/([a-z]+)")
	self.type, self.thumbnail = mimeHandlers[prefix](src, thumbDest, suffix)

	lfs.mkdir(File.Paths.Storage .. self.id)

	file_move(src, File.Paths.Storage .. self.id .. "/file" .. self.extension)

	if self.thumbnail and self.thumbnail ~= "" then
		file_move(thumbDest .. self.thumbnail, File.Paths.Storage .. self.id .. "/thumb" .. self.thumbnail)
	end

    self:ComputeVirtuals()
end

function FileMT:Save()
    local res, primary_push_action
    if self.not_in_db then
        res = database.get_shared():query_safe(
            'INSERT INTO files \
                (id, name, "user", extension, type, size, thumbnail) VALUES (%s, %s, %s, %s, %s, %s, %s) \
                RETURNING ' .. database.TIME_COLUMNS,
            self.id, self.name, self.user, self.extension, self.type, self.size, self.thumbnail or ""
        )
        primary_push_action = 'create'
        self.not_in_db = nil
    else
        res = database.get_shared():query_safe(
            'UPDATE files \
                SET name = %s, "user" = %s, extension = %s, type = %s, size = %s, thumbnail = %s, \
                updatedat = (now() at time zone \'utc\') \
                WHERE id = %s \
                RETURNING ' .. database.TIME_COLUMNS,
            self.name, self.user, self.extension, self.type, self.size, self.thumbnail or "", self.id
        )
        primary_push_action = 'refresh'
    end
    self.createdat = res[1].createdat
    self.updatedat = res[1].updatedat

	events.push_raw({
		action = "file:" .. primary_push_action,
		file = self,
	}, self.user)
	events.push_raw({
		action = "usedbytes",
		usedbytes = User.CalculateUsedBytes(self.user),
	}, self.user)
end

FileMT.__index = FileMT

return File
