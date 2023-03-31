local utils = require('foxcaves.utils')
local config = require('foxcaves.config').postgres
local pgmoon = require('pgmoon')
local next = next
local error = error
local ngx = ngx
local unpack = unpack
local setmetatable = setmetatable

local M = {}
require('foxcaves.module_helper').setmodenv()

config.socket_type = 'nginx'

M.TIME_COLUMNS =
    "to_json(updated_at at time zone 'utc') as updated_at_str, " .. "to_json(created_at at time zone 'utc') as created_at_str"

M.TIME_COLUMNS_EXPIRING = "to_json(expires_at at time zone 'utc') as expires_at_str, " .. M.TIME_COLUMNS

local db_meta = {}
function db_meta:query(query, options, ...)
    local args = { ... }
    for i, v in next, args do
        if v == nil or v == ngx.null then
            args[i] = 'NULL'
        else
            args[i] = self.db:escape_literal(v)
        end
    end
    query = query:format(unpack(args))

    if options then
        if options.order_by then
            query =
                query .. ' ORDER BY ' .. self.db:escape_identifier(
                    options.order_by.column
                ) .. ' ' .. (options.order_by.desc and 'DESC' or 'ASC')
        end

        if options.limit and options.limit > 0 then
            query = query .. ' LIMIT ' .. self.db:escape_literal(options.limit)
        end
        if options.offset and options.offset > 0 then
            query = query .. ' OFFSET ' .. self.db:escape_literal(options.offset)
        end
    end

    local res, err = self.db:query(query)
    if not res then
        error('Postgres query error: ' .. err .. '! During query: ' .. query)
    end
    return res
end

function db_meta:query_single(query, options, ...)
    local res = self:query(query, options, ...)
    return res[1]
end

db_meta.__index = db_meta

function M.make()
    local database = pgmoon.new(config)
    local _, err = database:connect()
    if err then
        error('Error connecting to Postgres: ' .. err)
    end

    utils.register_shutdown(function()
        database:keepalive(config.keepalive_timeout or 10000, config.keepalive_count or 10)
    end)

    return setmetatable({ db = database }, db_meta)
end

function M.get_shared()
    local database = ngx.ctx.__database
    if database then
        return database
    end
    database = M.make()
    ngx.ctx.__database = database
    return database
end

return M