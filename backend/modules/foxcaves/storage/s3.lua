local http = require("resty.http")
local awssig = require("resty.aws-signature")

local setmetatable = setmetatable
local error = error
local ngx = ngx
local pairs = pairs
local tostring = tostring
local table = table

local M = {}
M.__index = M
local UPLOAD = {}
UPLOAD.__index = UPLOAD
require("foxcaves.module_helper").setmodenv()

local function build_key(self, id, ftype)
    return "/" .. self.config.bucket .. "/" .. id .. "/" .. ftype
end

local function s3_request_raw(self, method, path, query, body, rawHeaders)
    local headers = rawHeaders or {}
    query = query or ""
    headers["content-length"] = body and tostring(#body) or "0"

    self.awssig:aws_set_headers(self.host, path, query, {
        body = body or "",
        method = method,
        region = self.region,
        service = "s3",
        set_header_func = function(key, value)
            headers[key] = value
        end,
    })

    local httpc = http.new()
    local ok, err = httpc:connect({
        scheme = "https",
        host = self.host,
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

    local function done()
        if self.config.keepalive then
            httpc:set_keepalive(self.config.keepalive.idle_timeout, self.config.keepalive.pool_size)
        else
            httpc:close()
        end
    end

    return resp, done
end

local function s3_request(self, method, path, query, body, rawHeaders)
    local resp, done = s3_request_raw(self, method, path, query, body, rawHeaders)
    local resp_body = resp:read_body()
    done()

    if (not resp.status) or (resp.status < 200) or (resp.status > 299) then
        error("S3API request " .. method .. " " .. path .. "?" .. query .. " failed! " ..
              "Status: " .. tostring(resp.status) .. " Body: " .. tostring(resp_body))
    end

    return resp, resp_body
end

local function s3_request_stream(self, method, path, query, body, rawHeaders)
    local resp, done = s3_request_raw(self, method, path, query, body, rawHeaders)

    if (not resp.status) or (resp.status < 200) or (resp.status > 299) then
        local resp_body = resp:read_body()
        done()
        error("S3API request " .. method .. " " .. path .. "?" .. query .. " failed! " ..
              "Status: " .. tostring(resp.status) .. " Body: " .. tostring(resp_body))
    end

    ngx.header["Content-Length"] = resp.headers["Content-Length"]

    while true do
        local buffer, err = resp.body_reader(8192)
        if err then
            error(err)
            break
        end

        if not buffer then
            break
        end

        ngx.print(buffer)
    end

    done()
end

function M.new(config)
    return setmetatable({
        config = config,
        awssig = awssig.new({
            access_key = config.access_key,
            secret_key = config.secret_key,
        }),
        host = config.host or "s3.amazonaws.com",
        region = config.region or "us-east-1",
    }, M)
end

function M:open(id, ftype, mimeType)
    local function make_headers()
        return {
            ["content-type"] = mimeType,
        }
    end

    local key = build_key(self, id, ftype)
    local _, resp_body = s3_request(self, "POST", key, "uploads=1", "", make_headers())

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
        headers = make_headers,
        module = self,
        parts = {},
    }, UPLOAD)
end

function M:send_to_client(id, ftype)
    local key = build_key(self, id, ftype)
    s3_request_stream(self, "GET", key, "", "")
end

function M:delete(id, ftype)
    s3_request(self, "DELETE", build_key(self, id, ftype))
end

function UPLOAD:chunk(chunk)
    if not chunk then
        error("Invalid chunk!")
    end

    local part_number = self.part_number
    self.part_number = self.part_number + 1

    local resp, _ = s3_request(
        self.module,
        "PUT", self.key,
        "partNumber="  .. tostring(part_number) .. "&uploadId=" .. self.uploadId,
        chunk, self.headers())
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

    s3_request(self.module, "POST", self.key, "uploadId=" .. self.uploadId, table.concat(body, ""), {
        ["content-type"] = "text/xml",
    })
end

function UPLOAD:abort()
    s3_request(self.module, "DELETE", self.key, "uploadId=" .. self.uploadId)
    s3_request(self.module, "DELETE", self.key)
end

return M
