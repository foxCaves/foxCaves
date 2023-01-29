local config = require("foxcaves.config").storage
local awss3 = require("resty.s3")
local awss3_util = require("resty.s3_util")

local setmetatable = setmetatable
local error = error
local ngx = ngx
local pairs = pairs

local s3 = awss3:new(config.access_key, config.secret_key, config.bucket, config.args)

local M = {}
local UPLOAD = {}
UPLOAD.__index = UPLOAD
require("foxcaves.module_helper").setmodenv()

function M:open(id, ftype, mimeType)
    local key = id .. "/" .. ftype

	local headers = awss3_util.new_headers()
    headers["Content-Type"] = mimeType
	local ok, uploader = s3:start_multi_upload(key, headers)
    if not ok then
        error("Could not start upload: " .. uploader)
    end

    return setmetatable({
        id = id,
        part_number = 1,
        ftype = ftype,
        uploader = uploader,
    }, UPLOAD)
end

function M:send_to_client(id, ftype)
    local key = id .. "/" .. ftype

    local host = (config.args and config.args.host) or "s3.amazonaws.com"
    ngx.var.fcv_proxy_host = host

    local short_uri = s3:get_short_uri(key)
    local headers = awss3_util.new_headers()
    headers["host"] = host
    local authorization = s3.auth:authorization_v4("GET", short_uri, headers, nil)

    ngx.var.fcv_proxy_x_amz_date = headers["x-amz-date"]
    ngx.var.fcv_proxy_x_amz_content_sha256 = headers["x-amz-content-sha256"]

    ngx.var.fcv_proxy_authorization = authorization
    ngx.var.fcv_proxy_url = short_uri
    ngx.req.set_uri("/fcv-proxyget", true)
end

function M:delete(id, ftype)
    local key = id .. "/" .. ftype
    s3:delete(key)
end

function UPLOAD:chunk(chunk)
    local ok, resp = self.uploader:upload(self.part_number, chunk, awss3_util.new_headers())
    self.part_number = self.part_number + 1

    if not ok then
        self:abort()
        error("Uploading " .. tostring(self.ftype) .. " ID " .. tostring(self.id) .. " failed! Error: " .. tostring(resp))
    end
end

function UPLOAD:finish()
	local ok, resp = self.uploader:complete()
	if not ok then
        self:abort()
		error("Finishing upload failed! Error: " .. tostring(resp))
	end
end

function UPLOAD:abort()
    self.uploader:abort()
    M:delete(self.id, self.ftype)
end

return M
