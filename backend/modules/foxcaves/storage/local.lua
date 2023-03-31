local lfs = require('lfs')

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

function M:open(id, size, ftype)
    local dir = self.config.root_folder .. '/' .. id
    lfs.mkdir(dir)
    local filename = dir .. '/' .. ftype

    local fh = io.open(filename, 'wb')
    if not fh then
        error('Could not open file ' .. filename .. ' for writing')
    end

    return setmetatable(
        {
            id = id,
            size = size,
            ftype = ftype,
            fh = fh,
            config = self.config,
        },
        UPLOAD
    )
end

function M:delete(id, ftype)
    local dir = self.config.root_folder .. '/' .. id
    os.remove(dir .. '/' .. ftype)
    lfs.rmdir(dir)
end

function M:send_to_client(id, ftype)
    ngx.req.set_uri_args({})
    ngx.req.set_uri('/fcv-rawget' .. self.config.root_folder .. '/' .. id .. '/' .. ftype, true)
end

function UPLOAD:from_callback(cb)
    local remaining = self.size
    while remaining > 0 do
        local data = cb(math_min(self.config.chunk_size, remaining))
        self:chunk(data)
        remaining = remaining - data:len()
    end
    self:finish()
end

function UPLOAD:chunk(chunk)
    self.fh:write(chunk)
end

function UPLOAD:finish()
    if self.fh then
        self.fh:close()
    end
    self.fh = nil
end

function UPLOAD:abort()
    self:finish()
    M:delete(self.id, self.ftype)
end

return M