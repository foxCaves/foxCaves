local cjson = require('cjson')
local ngx = ngx
local table = table
local next = next
local pcall = pcall
local tostring = tostring
local setmetatable = setmetatable

local M = {}
require('foxcaves.module_helper').setmodenv()

function M.get_post_args()
    ngx.req.read_body()
    local ctype = ngx.var.http_content_type

    if ctype and ctype:lower() == 'application/json' then
        local data = ngx.req.get_body_data()
        local ok, res = pcall(cjson.decode, data)
        if not ok then
            return {}
        end
        return res or {}
    end

    return ngx.req.get_post_args() or {}
end

function M.api_error(error, code)
    return { error = error }, (code or 400)
end

function M.explode(div, str)
    -- credit: http://richard.warburton.it
    local pos, arr = 0, {}
    -- for each divider found
    for st, sp in
        function()
            return str:find(div, pos, true)
        end
    do
        table.insert(arr, str:sub(pos, st - 1)) -- Attach chars left of current divider
        pos = sp + 1 -- Jump past current divider
    end
    table.insert(arr, str:sub(pos)) -- Attach chars right of last divider
    return arr
end

function M.is_falsy_or_null(v)
    return not v or v == ngx.null
end

function M.shorten_string(str, len)
    local curlen = str:len()
    if curlen <= len then
        return str, curlen
    end

    return str:sub(1, len), len
end

function M.add_cdn_cache_control()
    ngx.header['Cache-Control'] = 'public, max-age=86400, immutable'
end

function M.get_or_default(val, default)
    if M.is_falsy_or_null(val) then
        return default
    end
    return val
end

function M.get_or_default_str(val, default)
    return tostring(M.get_or_default(val, default))
end

function M.make_array()
    return setmetatable({}, cjson.array_mt)
end

local function collect_keys(tbl, sort)
    local key_tbl = {}
    for key in next, tbl do
        table.insert(key_tbl, key)
    end
    table.sort(key_tbl, sort)
    return key_tbl
end

function M.sorted_pairs(tbl, sort)
    local key_tbl = collect_keys(tbl, sort)
    local i = 0
    return function()
        i = i + 1
        local key = key_tbl[i]
        if key then
            return key, tbl[key]
        end
    end
end

function M.url_to_domain(url)
    return url:gsub('^https?://', ''):gsub(':.*$', '')
end

return M
