local lfs = require("lfs")
local path = require("path")
local database = require("foxcaves.database")
local random = require("foxcaves.random")
local user_model = require("foxcaves.models.user")
local short_url = require("foxcaves.config").http.short_url
local ROOT = require("foxcaves.consts").ROOT
local exec = require("foxcaves.exec")
local mimetypes = require("foxcaves.mimetypes")
local utils = require("foxcaves.utils")

local io = io
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
    consts = {
        NAME_MAX_LEN = 255,
        EXT_MAX_LEN = 32,
    }
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

local function makefilemt(file)
    file.not_in_db = nil
    setmetatable(file, file_mt)
    return file
end

local file_select = 'id, name, owner, size, mimetype, thumbnail_mimetype, ' .. database.TIME_COLUMNS_EXPIRING

function file_model.get_by_query(query, ...)
    return file_model.get_by_query_raw('(expires_at IS NULL OR expires_at >= NOW()) AND uploaded = 1 AND (' .. query .. ')' , ...)
end

function file_model.get_by_query_raw(query, ...)
    local files = database.get_shared():query('SELECT ' .. file_select .. ' FROM files ' ..
                                              'WHERE ' .. query, ...)
    for k,v in next, files do
        files[k] = makefilemt(v)
    end
    return files
end

function file_model.get_by_user(user)
    if not user then
        return {}
    end

    if user.id then
        user = user.id
    end

    return file_model.get_by_query('owner = %s', user)
end

function file_model.get_by_id(id)
    if not id then
        return nil
    end

    local files = file_model.get_by_query('id = %s', id)
    if files and files[1] then
        return makefilemt(files[1])
    end
    return nil
end

function file_model.new()
    local file = {
        not_in_db = true,
        id = random.string(10),
        uploaded = 0,
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

local function file_storage_delete(file)
    local base = file_model.paths.storage .. file.id
    os.remove(base .. "/file")
    os.remove(base .. "/thumb")
    lfs.rmdir(base)
end

function file_mt:delete()
    file_storage_delete(self)

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

function file_mt:set_name(rawname)
    local name, ext = file_model.extract_name_and_extension(
        file_model.sanitize_filename(rawname)
    )

    if not name then
        return false
    end

    local fullname
    if ext then
        local extlen
        ext, extlen = utils.shorten_string(ext, file_model.consts.EXT_MAX_LEN)
        fullname = utils.shorten_string(name, file_model.consts.NAME_MAX_LEN - (extlen + 1)) .. "." .. ext
    else
        fullname = utils.shorten_string(name, file_model.consts.NAME_MAX_LEN)
    end

    self.name = fullname

    return true
end

function file_mt:compute_mimetype()
    if not self.name then
        return false
    end
    self.mimetype = mimetypes[self:get_extension()] or "application/octet-stream"
    return true
end

function file_mt:upload_begin()
    self.uploaded = 0

    lfs.mkdir(file_model.paths.storage .. self.id)
    self._fh = io.open(self:make_local_path(), "wb")
    self._fhsize = 0
end

function file_mt:upload_chunk(chunk)
    self._fh:write(chunk)
    self._fhsize = self._fhsize + chunk:len()
end

function file_mt:upload_finish()
    self._fh:close()
    self._fh = nil
    self._fhsize = nil

    local prefix, suffix = self.mimetype:match("([a-z]+)/([a-z]+)")
    local handler = mimeHandlers[prefix]
    if handler then
        self.thumbnail_mimetype = handler(self:make_local_path(), file_model.paths.storage .. self.id .. "/thumb", suffix)
    end

    self.uploaded = 1
end

function file_mt:upload_abort()
    self:upload_finish()
    file_storage_delete(self)
end

function file_mt:save()
    local res, primary_push_action
    if self.not_in_db then
        res = database.get_shared():query_single(
            'INSERT INTO files \
                (id, name, owner, size, mimetype, thumbnail_mimetype, uploaded, expires_at) VALUES (%s, %s, %s, %s, %s, %s, %s, %s) \
                RETURNING ' .. database.TIME_COLUMNS_EXPIRING,
            self.id, self.name, self.owner, self.size, self.mimetype, self.thumbnail_mimetype or "", self.uploaded,
            self.expires_at or ngx.null
        )
        primary_push_action = 'create'
        self.not_in_db = nil
    else
        res = database.get_shared():query_single(
            'UPDATE files \
                SET name = %s, owner = %s, size = %s, mimetype = %s, thumbnail_mimetype = %s, uploaded = %s, \
                expires_at = %s, updated_at = (now() at time zone \'utc\') \
                WHERE id = %s \
                RETURNING ' .. database.TIME_COLUMNS_EXPIRING,
            self.name, self.owner, self.size, self.mimetype, self.thumbnail_mimetype or "", self.uploaded,
            self.expires_at or ngx.null, self.id
        )
        primary_push_action = 'update'
    end
    self.created_at = res.created_at
    self.updated_at = res.updated_at
    self.expires_at = res.expires_at
    if self.expires_at == ngx.null then
        self.expires_at = nil
    end

    if self.uploaded == 1 then
        local owner = user_model.get_by_id(self.owner)
        owner:send_event(primary_push_action, 'file', self:get_private())
        owner:send_self_event()
    end
end

function file_mt:get_extension()
    local _, ext = file_model.extract_name_and_extension(self.name)
    return ext
end

function file_mt:get_public()
    local short_url_file = short_url .. "/f/" .. self.id

    local res = {
        id = self.id,
        name = self.name,
        owner = self.owner,
        size = self.size,
        created_at = self.created_at,
        updated_at = self.updated_at,
        expires_at = self.expires_at,
        mimetype = self.mimetype,

        view_url = short_url_file,
        direct_url = short_url_file .. "?raw=1",
        download_url = short_url_file .. "?dl=1",
    }
    if self.thumbnail_mimetype and self.thumbnail_mimetype ~= "" then
        res.thumbnail_url = short_url .. "/t/" .. self.id
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
        expires_at = {
            type = "timestamp",
            required = false,
        },
    }
end
file_model.get_private_fields = file_model.get_public_fields

file_mt.__index = file_mt

return file_model
