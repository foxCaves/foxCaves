local config = require("foxcaves.config").storage
local lfs = require("lfs")

local ngx = ngx
local os = os
local io = io
local setmetatable = setmetatable

local M = {}
local UPLOAD = {}
UPLOAD.__index = UPLOAD
require("foxcaves.module_helper").setmodenv()

function M.open(id, ftype)
    local dir = config.root_folder .. "/" .. id
    lfs.mkdir(dir)
    local filename = dir .. "/" .. ftype

    return setmetatable({
        id = id,
        ftype = ftype,
        fh = io.open(filename, "wb"),
    }, UPLOAD)
end

function M.delete(id, ftype)
    local dir = config.root_folder .. "/" .. id
    os.remove(dir .. "/" .. ftype)
    lfs.rmdir(dir)
end

function M.send_to_client(id, ftype)
    ngx.req.set_uri_args({})
    ngx.req.set_uri("/fcv-rawget/" .. id .. "/" .. ftype, true)
end

function UPLOAD:chunk(chunk)
    self.fh:write(chunk)
end

function UPLOAD:finish()
    self.fh:close()
    self.fh = nil
end

function UPLOAD:abort()
    self:finish()
    M:delete(self.id, self.ftype)
end

return M
