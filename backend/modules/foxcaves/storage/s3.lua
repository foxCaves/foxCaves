local http = require('resty.http')
local awssig = require('resty.aws-signature')
local hooks = require('foxcaves.hooks')

local setmetatable = setmetatable
local error = error
local ngx = ngx
local pairs = pairs
local tostring = tostring
local tonumber = tonumber
local table = table
local math_min = math.min
local coroutine_yield = coroutine.yield
local coroutine_wrap = coroutine.wrap

local M = {}
M.__index = M
local UPLOAD = {}
UPLOAD.__index = UPLOAD
local DOWNLOAD = {}
DOWNLOAD.__index = DOWNLOAD
require('foxcaves.module_helper').setmodenv()

local function build_key(self, id, ftype)
    if self.no_bucket_in_path then
        return '/' .. id .. '/' .. ftype
    end
    return '/' .. self.config.bucket .. '/' .. id .. '/' .. ftype
end

local function s3_request_raw(self, method, path, query, body, rawHeaders, opts)
    local headers = rawHeaders or {}
    opts = opts or {}
    query = query or ''

    if not opts.content_length then
        opts.content_length = body and #body or 0
    end
    headers['content-length'] = tostring(opts.content_length)

    self.awssig:aws_set_headers(self.host, path, query, {
        body = body or '',
        method = method,
        region = self.region,
        service = 's3',
        unsigned_payload = opts.unsigned_payload,
        set_header_func = function(key, value)
            headers[key] = value
        end,
    })

    local httpc = http.new()
    local ok, err = httpc:connect({
        scheme = 'https',
        host = self.host,
    })
    if not ok then
        error('S3API connection failed! Error: ' .. tostring(err))
    end

    local resp, req_err = httpc:request({
        path = path,
        query = query,
        method = method,
        body = body or '',
        headers = headers,
    })
    if req_err then
        if resp then
            resp:close()
        end
        error('S3API request ' .. method .. ' ' .. path .. '?' .. query .. ' failed! Error: ' .. tostring(req_err))
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

local function default_status_checker(status)
    return (status >= 200) and (status <= 299)
end

local function accept_404_status_checker(status)
    if status == 404 then
        return true
    end
    return default_status_checker(status)
end

local function s3_request(self, method, path, query, body, rawHeaders, opts)
    opts = opts or {}
    query = query or ''
    local resp, done = s3_request_raw(self, method, path, query, body, rawHeaders, opts)
    local resp_body = resp:read_body()
    done()

    if not opts.status_checker then
        opts.status_checker = default_status_checker
    end

    if not resp.status or not opts.status_checker(resp.status) then
        error(
            'S3API request ' .. method .. ' ' .. path .. '?' .. query .. ' failed! ' .. 'Status: ' .. tostring(
                resp.status
            ) .. ' Body: ' .. tostring(resp_body)
        )
    end

    return resp, resp_body
end

local function _cache_get(key)
    return ngx.shared.foxcaves:get('storage_s3_' .. key)
end

local function _cache_set(key, val)
    ngx.shared.foxcaves:set('storage_s3_' .. key, val)
end

function M.new(name, config)
    local inst = setmetatable(
        {
            name = name,
            config = config,
            awssig = awssig.new(
                {
                    access_key = config.access_key,
                    secret_key = config.secret_key,
                },
                _cache_get,
                _cache_set
            ),
            host = config.host or 's3.amazonaws.com',
            region = config.region or 'us-east-1',
        },
        M
    )
    if inst.host == 's3.amazonaws.com' then
        if inst.region ~= 'us-east-1' then
            inst.host = 's3.' .. inst.region .. '.amazonaws.com'
        end
        inst.host = inst.config.bucket .. '.' .. inst.host
        inst.no_bucket_in_path = true
    else
        inst.no_bucket_in_path = false
    end
    return inst
end

function M:upload(id, size, ftype, mimeType, opts)
    opts = opts or {}
    local function make_headers()
        return { ['content-type'] = mimeType }
    end

    local key = build_key(self, id, ftype)
    local _, resp_body = s3_request(self, 'POST', key, 'uploads=1', '', make_headers())

    local m = ngx.re.match(resp_body, '<UploadId>([^<>]+)</UploadId>', 'o')
    if not m then
        error('Invalid response from S3API: ' .. resp_body)
    end

    local ul = setmetatable(
        {
            id = id,
            size = size,
            ftype = ftype,
            part_number = 1,
            key = key,
            upload_id = ngx.escape_uri(m[1]),
            headers = make_headers,
            module = self,
            parts = {},
            done = false,
            on_abort = opts.on_abort,
        },
        UPLOAD
    )

    hooks.register_ctx('context_end', function()
        ul:abort_if_not_done()
    end)

    return ul
end

function M:download(id, ftype)
    local resp, done = s3_request_raw(self, 'GET', build_key(self, id, ftype))

    local dl = setmetatable(
        {
            resp = resp,
            done_cb = done,
            done = false,
            size = tonumber(resp.headers['content-length']),
        },
        DOWNLOAD
    )

    hooks.register_ctx('context_end', function()
        dl:close()
    end)

    return dl
end

function M:send_to_client(id, ftype)
    local key = build_key(self, id, ftype)
    ngx.var.fcv_proxy_host = 'storage-s3-' .. self.name
    ngx.var.fcv_proxy_uri = key

    ngx.req.set_uri_args({})
    self.awssig:aws_set_headers(self.host, key, '', {
        body = '',
        region = self.region,
        service = 's3',
    })
    ngx.req.set_uri('/fcv-s3get', true)
end

function M:delete(id, ftype)
    s3_request(self, 'DELETE', build_key(self, id, ftype))
end

function M:build_nginx_config()
    return [[upstream storage-s3-]] .. self.name .. [[ {
        server ]] .. self.host .. [[:443;
        keepalive ]] .. tostring(
        self.config.keepalive.pool_size
    ) .. [[;
        keepalive_requests ]] .. tostring(
        self.config.keepalive.max_requests
    ) .. [[;
        keepalive_time ]] .. tostring(
        self.config.keepalive.max_time
    ) .. [[s;
        keepalive_timeout ]] .. tostring(self.config.keepalive.idle_timeout) .. [[s;
}]]
end

function M.get_local_path_for()
    return nil
end

function UPLOAD:from_callback(cb)
    local remaining = self.size
    local read_chunk_max = self.module.config.read_chunk_size
    while remaining > 0 do
        local chunk_size = math_min(self.module.config.chunk_size, remaining)
        local function chunk_cb()
            local chunk_remaining = chunk_size
            while chunk_remaining > 0 do
                local data = cb(math_min(read_chunk_max, chunk_remaining))
                if not data then
                    error('Expected data, got none')
                end
                local len = data:len()
                chunk_remaining = chunk_remaining - len
                remaining = remaining - len
                coroutine_yield(data)
            end
            coroutine_yield(nil)
        end
        self:chunk(coroutine_wrap(chunk_cb), {
            unsigned_payload = true,
            content_length = chunk_size,
        })
    end
end

function UPLOAD:chunk(chunk, opts)
    if not chunk then
        error('Invalid chunk!')
    end

    local part_number = self.part_number
    self.part_number = self.part_number + 1

    local resp, _ =
        s3_request(
            self.module,
            'PUT',
            self.key,
            'partNumber=' .. tostring(part_number) .. '&uploadId=' .. self.upload_id,
            chunk,
            self.headers(),
            opts
        )
    local etag = resp.headers['ETag']

    if not etag or etag == 'error' then
        error('Invalid ETag from S3API: ' .. tostring(etag))
    end
    self.parts[part_number] = etag
end

function UPLOAD:finish()
    local body = { '<CompleteMultipartUpload>' }
    for part_number, etag in pairs(self.parts) do
        table.insert(
            body,
            '<Part><PartNumber>' .. tostring(part_number) .. '</PartNumber><ETag>' .. etag .. '</ETag></Part>'
        )
    end
    table.insert(body, '</CompleteMultipartUpload>')

    s3_request(self.module, 'POST', self.key, 'uploadId=' .. self.upload_id, table.concat(body, ''), {
        ['content-type'] = 'text/xml',
    })
    self.done = true
end

function UPLOAD:abort_if_not_done()
    if self.done then return end
    self:abort()
end

function UPLOAD:abort()
    s3_request(self.module, 'DELETE', self.key, 'uploadId=' .. self.upload_id, nil, nil, {
        status_checker = accept_404_status_checker,
    })
    s3_request(self.module, 'DELETE', self.key, nil, nil, nil, { status_checker = accept_404_status_checker })
    if self.on_abort then
        self.on_abort()
    end
end

function DOWNLOAD:read(size)
    if self.done then return end
    local data = self.resp.body_reader(size)
    if not data then
        self:close()
    end
    return data
end

function DOWNLOAD:close()
    if self.done then return end
    self.done = true
    self.done_cb()
end

return M
