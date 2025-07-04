local lfs = require('lfs')
local utils = require('foxcaves.utils')

local ngx = ngx
local os = os
local io = io
local error = error
local setmetatable = setmetatable
local tostring = tostring
local table = table
local math_min = math.min

local EEXIST = 17

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
    local dir = id:sub(1, 2) .. '/' .. id:sub(3, 4) .. '/' .. id
    return self.config.root_folder, dir .. '/' .. ftype
end

local function _get_dirs(root_dir, dir, skip_last)
    local res = {}
    local i = 1
    while i do
        i = dir:find('/', i, true)
        if i then
            i = i + 1
            table.insert(res, root_dir .. '/' .. dir:sub(1, i - 2))
        elseif not skip_last then
            table.insert(res, root_dir .. '/' .. dir)
        end
    end
    return res
end

function M:upload(id, size, ftype)
    local root_dir, filename = _get_local_dir_and_name_for(self, id, ftype)
    local dirs = _get_dirs(root_dir, filename, true)
    for i = 1, #dirs, 1 do
        local ok, errstr, errno = lfs.mkdir(dirs[i])
        if not ok and errno ~= EEXIST then
            error(
                'Could not create directory ' .. dirs[i] .. ' for ' .. filename .. ': ' .. tostring(
                    errstr
                ) .. ' (' .. tostring(errno) .. ')'
            )
        end
    end

    local fh, errstr, errno = io.open(root_dir .. '/' .. filename, 'wb')
    if not fh then
        error(
            'Could not open file ' .. filename .. ' for writing: ' .. tostring(errstr) .. ' (' .. tostring(errno) .. ')'
        )
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
    local filename = self:get_local_path_for(id, ftype)

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
    local root_dir, filename = _get_local_dir_and_name_for(self, id, ftype)
    os.remove(root_dir .. '/' .. filename)
    local dirs = _get_dirs(root_dir, filename, true)
    for i = #dirs, 1, -1 do
        lfs.rmdir(dirs[i])
    end
end

function M:get_local_path_for(id, ftype)
    local root_dir, filename = _get_local_dir_and_name_for(self, id, ftype)
    return root_dir .. '/' .. filename
end

function M:send_to_client(id, ftype)
    ngx.req.set_uri_args({})
    ngx.req.set_uri('/fcv-rawget' .. self:get_local_path_for(id, ftype), true)
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
