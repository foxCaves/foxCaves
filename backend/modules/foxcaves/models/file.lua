local lfs = require("lfs")
local path = require("path")
local utils = require("foxcaves.utils")
local database = require("foxcaves.database")
local random = require("foxcaves.random")
local user_model = require("foxcaves.models.user")
local url_config = require("foxcaves.config").urls
local ROOT = require("foxcaves.consts").ROOT
local exec = require("foxcaves.exec")

local io = io
local os = os
local ngx = ngx
local next = next
local setmetatable = setmetatable

local file_mt = {}

local file_model = {
    type = {
        other = 0,
        image = 1,
        text = 2,
        video = 3,
        audio = 4,
        iframe = 5,
    },
    paths = {
        storage = path.abs(ROOT .. "/storage/"),
        temp = path.abs(ROOT .. "/tmp/"),
    },
    thumbnails = {},
}

local function scan_thumbnails()
    local dir = path.abs(ROOT .. "/html/static/img/thumbs/")
    for file in lfs.dir(dir) do
        if file:sub(1, 4) == "ext_" then
            file_model.thumbnails[file:sub(5, file:len() - 4)] = file
        end
    end
end
scan_thumbnails()

require("foxcaves.module_helper").setmodenv()

local mimetypes = {
    ["bmp"] = "image/bmp",
    ["c"] = "text/plain",
    ["cpp"] = "text/plain",
    ["cs"] = "text/plain",
    ["css"] = "text/css",
    ["flac"] = "audio/flac",
    ["gif"] = "image/gif",
    ["h"] = "text/plain",
    ["htaccess"] = "text/plain",
    ["htm"] = "text/html",
    ["html"] = "text/html",
    ["java"] = "text/plain",
    ["jpeg"] = "image/jpeg",
    ["jpg"] = "image/jpeg",
    ["js"] = "text/javascript",
    ["lua"] = "text/plain",
    ["mp3"] = "audio/mpeg",
    ["mp4"] = "video/mp4",
    ["ogg"] = "audio/ogg",
    ["pdf"] = "application/pdf",
    ["php"] = "text/plain",
    ["php3"] = "text/plain",
    ["php4"] = "text/plain",
    ["php5"] = "text/plain",
    ["php6"] = "text/plain",
    ["phtm"] = "text/plain",
    ["phtml"] = "text/plain",
    ["pl"] = "text/plain",
    ["png"] = "image/png",
    ["py"] = "text/plain",
    ["shtm"] = "text/html",
    ["shtml"] = "text/html",
    ["txt"] = "text/plain",
    ["vb"] = "text/plain",
    ["wav"] = "audio/wav",
    ["webm"] = "video/webm",
}

local mimeHandlers = {
    image = function(src, dest)
        local thumbext = "png"
        local thumbnail = dest .. "." .. thumbext
        exec.cmd(
            "convert", src,
            "-thumbnail", "x300", "-resize", "300x<",
            "-resize", "50%", "-gravity", "center", "-crop", "150x150+0+0",
            "+repage", "-format", "png", thumbnail
        )
        if not lfs.attributes(thumbnail, "size") then
            return file_model.type.image, nil
        end
        return file_model.type.image, thumbext
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

        return file_model.type.text, "txt"
    end,

    video = function()
        return file_model.type.video, nil
    end,

    audio = function()
        return file_model.type.audio, nil
    end,

    application = function(_, _, suffix)
        if suffix == "pdf" then
            return file_model.type.iframe, nil
        end
        return file_model.type.other, nil
    end
}

local function file_move(src, dst)
    exec.cmd("mv", src, dst)
end

local function makefilemt(file)
    file.not_in_db = nil
    setmetatable(file, file_mt)
    file:compute_virtuals()
    return file
end

local function file_deletestorage(file)
    local base = file_model.paths.storage .. file.id
    os.remove(base .. "/file." .. file.extension)
    if file.thumbnail_extension and file.thumbnail_extension ~= "" then
        os.remove(base .. "/thumb." .. file.thumbnail_extension)
    end
    lfs.rmdir(base)
end

local file_select = 'id, name, "user", extension, type, size, thumbnail_extension, ' .. database.TIME_COLUMNS

function file_model.get_by_user(user)
    if not user then
        return {}
    end

    if user.id then
        user = user.id
    end

    local files = database.get_shared():query('SELECT ' .. file_select .. ' FROM files WHERE "user" = %s', user)
    for k,v in next, files do
        files[k] = makefilemt(v)
    end
    return files
end

function file_model.get_by_id(id)
    if not id then
        return nil
    end

    local file = database.get_shared():query_single('SELECT ' .. file_select .. ' FROM files WHERE id = %s', id)

    if not file then
        return nil
    end

    return makefilemt(file)
end

function file_model.new()
    local file = {
        not_in_db = true,
        id = random.string(10),
    }
    setmetatable(file, file_mt)
    return file
end

function file_model.get_extension_thumbnail(extension)
    local thumbnail = file_model.thumbnails[extension]
    if not thumbnail then
        thumbnail = "nothumb.png"
    end
    return url_config.main .. "/static/img/thumbs/" .. thumbnail
end

function file_mt:compute_virtuals()
    if self.thumbnail_extension and self.thumbnail_extension ~= "" then
        self.thumbnail_url = url_config.short .. "/thumbs/" .. self.id .. "." .. self.thumbnail_extension
    end
    if self.type == file_model.type.image and self.thumbnail_url then
        self.thumbnail_image = self.thumbnail_url
    else
        self.thumbnail_image = file_model.get_extension_thumbnail(self.extension)
    end

    self.view_url = url_config.short .. "/v" .. self.id
    self.direct_url = url_config.short .. "/f" .. self.id .. "." .. self.extension
    self.download_url = url_config.short .. "/d" .. self.id .. "." .. self.extension
    self.mimetype = mimetypes[self.extension] or "application/octet-stream"
end

function file_mt:delete()
    file_deletestorage(self)

    database.get_shared():query('DELETE FROM files WHERE id = %s', self.id)

    local user = user_model.get_by_id(self.user)
    user:send_event('delete', 'file', self)
    user:send_self_event()
end

function file_mt:make_local_path()
    return file_model.paths.storage .. self.id .. "/file." .. self.extension
end

function file_mt:set_owner(user)
    self.user = user.id or user
end

function file_mt:set_name(name)
    local nameregex = ngx.re.match(name, "^([^<>\r\n\t]*?)\\.([a-zA-Z0-9]+)?$", "o")

    if (not nameregex) or (not nameregex[1]) then
        return false
    end

    local newextension = (nameregex[2] or "bin"):lower()

    if self.extension and self.extension ~= newextension then
        file_deletestorage(self)
    end

    self.name = name
    self.extension = newextension

    self:compute_virtuals()

    return true
end

function file_mt:move_upload_data(src)
    self.size = lfs.attributes(src, "size")

    local thumbDest = file_model.paths.temp .. "thumb_" .. self.id

    local prefix, suffix = self.mimetype:match("([a-z]+)/([a-z]+)")
    self.type, self.thumbnail_extension = mimeHandlers[prefix](src, thumbDest, suffix)

    lfs.mkdir(file_model.paths.storage .. self.id)

    file_move(src, file_model.paths.storage .. self.id .. "/file." .. self.extension)

    if self.thumbnail_extension and self.thumbnail_extension ~= "" then
        file_move(thumbDest .. "." .. self.thumbnail_extension,
                    file_model.paths.storage .. self.id .. "/thumb." .. self.thumbnail_extension)
    end

    self:compute_virtuals()
end

function file_mt:save()
    local res, primary_push_action
    if self.not_in_db then
        res = database.get_shared():query_single(
            'INSERT INTO files \
                (id, name, "user", extension, type, size, thumbnail_extension) VALUES (%s, %s, %s, %s, %s, %s, %s) \
                RETURNING ' .. database.TIME_COLUMNS,
            self.id, self.name, self.user, self.extension, self.type, self.size, self.thumbnail_extension or ""
        )
        primary_push_action = 'create'
        self.not_in_db = nil
    else
        res = database.get_shared():query_single(
            'UPDATE files \
                SET name = %s, "user" = %s, extension = %s, type = %s, size = %s, thumbnail_extension = %s, \
                updated_at = (now() at time zone \'utc\') \
                WHERE id = %s \
                RETURNING ' .. database.TIME_COLUMNS,
            self.name, self.user, self.extension, self.type, self.size, self.thumbnail_extension or "", self.id
        )
        primary_push_action = 'update'
    end
    self.created_at = res.created_at
    self.updated_at = res.updated_at

    local user = user_model.get_by_id(self.user)
    user:send_event(primary_push_action, 'file', self)
    user:send_self_event()
end

file_mt.__index = file_mt

return file_model
