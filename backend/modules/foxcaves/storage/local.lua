local lfs = require('lfs')
local utils = require('foxcaves.utils')

local ngx = ngx
local os = os
local io = io
local error = error
local setmetatable = setmetatable
local math_min = math.min

local M = {}
M.__index = M
local UPLOAD = {}
UPLOAD.__index = UPLOAD
local DOWNLOAD = {}
DOWNLOAD.__index = DOWNLOAD
require('foxcaves.module_helper').setmodenv()

function M.new(name, config)
    return setmetatable(
        {
            name = name,
            config = config,
        },
        M
    )
end

local function _get_local_dir_and_name_for(self, id, ftype)
    local dir = self.config.root_folder .. '/' .. id
    return dir, dir .. '/' .. ftype
end

function M:upload(id, size, ftype)
    local dir, filename = _get_local_dir_and_name_for(self, id, ftype)
    lfs.mkdir(dir)

    local fh = io.open(filename, 'wb')
    if not fh then
        error('Could not open file ' .. filename .. ' for writing')
    end

    local ul = setmetatable(
        {
            id = id,
            size = size,
            ftype = ftype,
            fh = fh,
            done = false,
            storage = self,
        },
        UPLOAD
    )

    utils.register_shutdown(function()
        ul:abort_if_not_done()
    end)

    return ul
end

function M:download(id, ftype)
    local _, filename = _get_local_dir_and_name_for(self, id, ftype)

    local dl = setmetatable(
        {
            fh = io.open(filename, 'rb'),
            size = lfs.attributes(filename, 'size'),
        },
        DOWNLOAD
    )

    utils.register_shutdown(function()
        dl:close()
    end)

    return dl
end

function M:delete(id, ftype)
    local dir, filename = _get_local_dir_and_name_for(self, id, ftype)
    os.remove(filename)
    lfs.rmdir(dir)
end

function M:get_local_path_for(id, ftype)
    local _, filename = _get_local_dir_and_name_for(self, id, ftype)
    return filename
end

function M:send_to_client(id, ftype)
    local _, filename = _get_local_dir_and_name_for(self, id, ftype)
    ngx.req.set_uri_args({})
    ngx.req.set_uri('/fcv-rawget' .. filename, true)
end

function UPLOAD:from_callback(cb)
    local remaining = self.size
    while remaining > 0 do
        local data = cb(math_min(self.storage.config.chunk_size, remaining))
        if not self:chunk(data) then
            self:abort()
            return false
        end
        remaining = remaining - data:len()
    end
    self:finish()
    return true
end

function UPLOAD:chunk(chunk)
    if not chunk then
        error('Invalid chunk!')
    end

    if not self.fh then
        return false
    end
    self.fh:write(chunk)
    return true
end

function UPLOAD:finish()
    if self.fh then
        self.fh:close()
    end
    self.fh = nil
    self.done = true
end

function UPLOAD:abort()
    self:finish()
    self.storage:delete(self.id, self.ftype)
end

function UPLOAD:abort_if_not_done()
    if self.done then return end
    self:abort()
end

function DOWNLOAD:read(size)
    if not self.fh then
        return nil
    end
    return self.fh:read(size)
end

function DOWNLOAD:close()
    if self.fh then
        self.fh:close()
    end
    self.fh = nil
end

return M
