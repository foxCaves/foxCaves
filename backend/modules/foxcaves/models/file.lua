local lfs = require("lfs")
local path = require("path")
local database = require("foxcaves.database")
local random = require("foxcaves.random")
local user_model = require("foxcaves.models.user")
local url_config = require("foxcaves.config").urls
local ROOT = require("foxcaves.consts").ROOT
local exec = require("foxcaves.exec")
local mimetypes = require("foxcaves.mimetypes")

local os = os
local ngx = ngx
local next = next
local setmetatable = setmetatable

local file_mt = {}

local file_model = {
    paths = {
        storage = path.abs(ROOT .. "/storage/"),
        temp = path.abs(ROOT .. "/tmp/"),
    },
}

require("foxcaves.module_helper").setmodenv()


local mimeHandlers = {
    image = function(src, dest)
        exec.cmd(
            "convert", src,
            "-thumbnail", "x300", "-resize", "300x<",
            "-resize", "50%", "-gravity", "center", "-crop", "150x150+0+0",
            "+repage", "-format", "png", dest
        )
        if not lfs.attributes(dest, "size") then
            return nil
        end
        return "image/png"
    end
}

local function file_move(src, dst)
    exec.cmd("mv", src, dst)
end

local function makefilemt(file)
    file.not_in_db = nil
    setmetatable(file, file_mt)
    return file
end

local function file_deletestorage(file)
    local base = file_model.paths.storage .. file.id
    os.remove(base .. "/file")
    if file.thumbnail_mimetype and file.thumbnail_mimetype ~= "" then
        os.remove(base .. "/thumb")
    end
    lfs.rmdir(base)
end

local file_select = 'id, name, owner, size, mimetype, thumbnail_mimetype, ' .. database.TIME_COLUMNS

function file_model.get_by_user(user)
    if not user then
        return {}
    end

    if user.id then
        user = user.id
    end

    local files = database.get_shared():query('SELECT ' .. file_select .. ' FROM files WHERE owner = %s', user)
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

function file_model.sanitize_filename(name)
    return ngx.re.gsub(name, "[<>\r\n\t:/\\\\]+", "_", "o")
end

function file_model.extract_name_and_extension(name)
    if not name then
        return nil, nil
    end
    local res = ngx.re.match(name, "^(.*?)(\\.[a-zA-Z0-9_-]+)?$", "o")
    if not res then
        return nil, nil
    end
    return res[1], (res[2] and res[2]:sub(2):lower())
end

function file_mt:delete()
    file_deletestorage(self)

    database.get_shared():query('DELETE FROM files WHERE id = %s', self.id)

    local owner = user_model.get_by_id(self.owner)
    owner:send_event('delete', 'file', self:get_private())
    owner:send_self_event()
end

function file_mt:make_local_path()
    return file_model.paths.storage .. self.id .. "/file"
end

function file_mt:set_owner(user)
    self.owner = user.id or user
end

function file_mt:set_name(name)
    name = file_model.sanitize_filename(name)
    local n, ext = file_model.extract_name_and_extension(name)

    if not n then
        return false
    end

    self.name = name
    self.mimetype = mimetypes[ext] or "application/octet-stream"

    return true
end

function file_mt:move_upload_data(src)
    self.size = lfs.attributes(src, "size")

    local thumbDest = file_model.paths.temp .. "thumb_" .. self.id

    local prefix, suffix = self.mimetype:match("([a-z]+)/([a-z]+)")
    local handler = mimeHandlers[prefix]
    if handler then
        self.thumbnail_mimetype = handler(src, thumbDest, suffix)
    end

    lfs.mkdir(file_model.paths.storage .. self.id)

    file_move(src, file_model.paths.storage .. self.id .. "/file")

    if self.thumbnail_mimetype and self.thumbnail_mimetype ~= "" then
        file_move(thumbDest, file_model.paths.storage .. self.id .. "/thumb")
    end
end

function file_mt:save()
    local res, primary_push_action
    if self.not_in_db then
        res = database.get_shared():query_single(
            'INSERT INTO files \
                (id, name, owner, size, mimetype, thumbnail_mimetype) VALUES (%s, %s, %s, %s, %s, %s) \
                RETURNING ' .. database.TIME_COLUMNS,
            self.id, self.name, self.owner, self.size, self.mimetype, self.thumbnail_mimetype or ""
        )
        primary_push_action = 'create'
        self.not_in_db = nil
    else
        res = database.get_shared():query_single(
            'UPDATE files \
                SET name = %s, owner = %s, size = %s, mimetype = %s, thumbnail_mimetype = %s, \
                updated_at = (now() at time zone \'utc\') \
                WHERE id = %s \
                RETURNING ' .. database.TIME_COLUMNS,
            self.name, self.owner, self.size, self.mimetype, self.thumbnail_mimetype or "", self.id
        )
        primary_push_action = 'update'
    end
    self.created_at = res.created_at
    self.updated_at = res.updated_at

    local owner = user_model.get_by_id(self.owner)
    owner:send_event(primary_push_action, 'file', self:get_private())
    owner:send_self_event()
end

function file_mt:get_extension()
    local _, ext = file_model.extract_name_and_extension(self.name)
    return ext
end

function file_mt:get_public()
    local short_url = url_config.short .. "/f/" .. self.id

    local res = {
        id = self.id,
        name = self.name,
        owner = self.owner,
        size = self.size,
        created_at = self.created_at,
        updated_at = self.updated_at,
        mimetype = self.mimetype,

        view_url = short_url,
        direct_url = short_url .. "?raw=1",
        download_url = short_url .. "?dl=1",
    }
    if self.thumbnail_mimetype and self.thumbnail_mimetype ~= "" then
        res.thumbnail_url = url_config.short .. "/t/" .. self.id
    end
    return res
end
file_mt.get_private = file_mt.get_public

function file_model.get_public_fields()
    return {
        id = {
            type = "string",
            required = true,
        },
        name = {
            type = "string",
            required = true,
        },
        owner = {
            type = "uuid",
            required = true,
        },
        size = {
            type = "integer",
            required = true,
        },
        created_at = {
            type = "timestamp",
            required = true,
        },
        updated_at = {
            type = "timestamp",
            required = true,
        },
        mimetype = {
            type = "string",
            required = true,
        },
        view_url = {
            type = "string",
            required = true,
        },
        direct_url = {
            type = "string",
            required = true,
        },
        download_url ={
            type = "string",
            required = true,
        },
        thumbnail_url = {
            type = "string",
            required = false,
        },
    }
end
file_model.get_private_fields = file_model.get_public_fields

file_mt.__index = file_mt

return file_model
