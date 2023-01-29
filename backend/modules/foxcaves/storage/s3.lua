local config = require("foxcaves.config").storage
local http = require("resty.http")

local setmetatable = setmetatable
local error = error
local ngx = ngx
local pairs = pairs
local tostring = tostring
local table = table

local awssig = require("resty.aws-signature").new({
    access_key = config.access_key,
    secret_key = config.secret_key,
})
local host = config.host or "s3.amazonaws.com"
local region = config.region or "us-east-1"

local M = {}
local UPLOAD = {}
UPLOAD.__index = UPLOAD
require("foxcaves.module_helper").setmodenv()

local function build_key(id, ftype)
    return "/" .. config.bucket .. "/" .. id .. "/" .. ftype
end

local function s3_request(method, path, query, body, rawHeaders)
    local headers = rawHeaders or {}
    query = query or ""
    headers["content-length"] = body and tostring(#body) or "0"

    awssig:aws_set_headers(host, path, query, {
        body = body or "",
        method = method,
        region = region,
        service = "s3",
        set_header_func = function(key, value)
            headers[key] = value
        end,
    })

    local httpc = http.new()
    local ok, err = httpc:connect({
        scheme = "https",
        host = host,
    })
    if not ok then
        error("S3API connection failed! Error: " .. tostring(err))
    end

    local resp, req_err = httpc:request({
        path = path,
        query = query,
        method = method,
        body = body or "",
        headers = headers,
    })
    if not resp then
        resp:close()
        error("S3API request " .. method .. " " .. path .. "?" .. query .. " failed! Error: " .. tostring(req_err))
    end

    local resp_body = resp:read_body()

    if config.keepalive then
        httpc:set_keepalive(config.keepalive.idle_timeout, config.keepalive.pool_size)
    else
        httpc:close()
    end

    if (not resp.status) or (resp.status < 200) or (resp.status > 299) then
        error("S3API request " .. method .. " " .. path .. "?" .. query .. " failed! " ..
              "Status: " .. tostring(resp.status) .. " Body: " .. tostring(resp_body))
    end

    return resp, resp_body
end

function M.open(id, ftype, mimeType)
    local function makeHeaders()
        return {
            ["content-type"] = mimeType,
        }
    end

    local key = build_key(id, ftype)
    local _, resp_body = s3_request("POST", key, "uploads=1", "", makeHeaders())

    local m = ngx.re.match(resp_body, "<UploadId>([^<>]+)</UploadId>", "o")
    if not m then
        error("Invalid response from S3API: " .. resp_body)
    end

    return setmetatable({
        id = id,
        part_number = 1,
        ftype = ftype,
        key = key,
        uploadId = m[1],
        headers = makeHeaders,

        parts = {},
    }, UPLOAD)
end

function M.send_to_client(id, ftype)
    local key = build_key(id, ftype)
    awssig:aws_set_headers(host, key, "", {
        method = "GET",
        body = "",
        region = region,
        service = "s3",
    })
    ngx.req.set_uri_args({})
    ngx.req.set_uri("/fcv-proxyget" .. key, true)
end

function M.delete(id, ftype)
    s3_request("DELETE", build_key(id, ftype))
end

function UPLOAD:chunk(chunk)
    if not chunk then
        error("Invalid chunk!")
    end

    local part_number = self.part_number
    self.part_number = self.part_number + 1

    local resp, _ = s3_request("PUT", self.key, "partNumber="  .. tostring(part_number) .. "&uploadId=" .. self.uploadId, chunk, self.headers())
    local etag = resp.headers["ETag"]

    if (not etag) or etag == "error" then
        error("Invalid ETag from S3API: " .. tostring(etag))
    end
    self.parts[part_number] = etag
end

function UPLOAD:finish()
    local body = {"<CompleteMultipartUpload>"}
    for part_number, etag in pairs(self.parts) do
        table.insert(body, "<Part><PartNumber>" .. tostring(part_number) .. "</PartNumber><ETag>" .. etag .. "</ETag></Part>")
    end
    table.insert(body, "</CompleteMultipartUpload>")

    s3_request("POST", self.key, "uploadId=" .. self.uploadId, table.concat(body, ""), {
        ["content-type"] = "text/xml",
    })
end

function UPLOAD:abort()
    s3_request("DELETE", self.key, "uploadId=" .. self.uploadId)
    s3_request("DELETE", self.key)
end

return M
