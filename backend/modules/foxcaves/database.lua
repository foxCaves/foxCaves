local utils = require('foxcaves.utils')
local config = require('foxcaves.config').postgres
local pgmoon = require('pgmoon')
local next = next
local error = error
local ngx = ngx
local unpack = unpack
local setmetatable = setmetatable
local table = table

local M = {}
require('foxcaves.module_helper').setmodenv()

config.socket_type = 'nginx'

M.TIME_COLUMNS =
    "to_json(updated_at at time zone 'utc') as updated_at_str, " .. "to_json(created_at at time zone 'utc') as created_at_str"

M.TIME_COLUMNS_EXPIRING = "to_json(expires_at at time zone 'utc') as expires_at_str, " .. M.TIME_COLUMNS

local db_meta = {}
function db_meta:query(query, options, ...)
    local args = { ... }
    if #args > 0 then
        local db_args = {}
        for _, v in next, args do
            local dbv
            if v == nil or v == ngx.null then
                dbv = 'NULL'
            else
                dbv = self.db:escape_literal(v)
            end
            table.insert(db_args, dbv)
        end
        query = query:format(unpack(db_args))
    end

    if options then
        if options.order_by then
            query =
                query .. ' ORDER BY ' .. self.db:escape_identifier(
                    options.order_by.column
                ) .. ' ' .. (options.order_by.desc and 'DESC' or 'ASC')
        end

        -- No need to escape these, Lua would error if they were not numbers
        if options.limit and options.limit > 0 then
            query = query .. ' LIMIT ' .. options.limit
        end
        if options.offset and options.offset > 0 then
            query = query .. ' OFFSET ' .. options.offset
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

function M.transfer_time_columns(model, res)
    model.created_at = res.created_at_str
    model.updated_at = res.updated_at_str
    if res.expires_at_str == ngx.null then
        model.expires_at = nil
    else
        model.expires_at = res.expires_at_str
    end

    model.created_at_str = nil
    model.updated_at_str = nil
    model.expires_at_str = nil
end

return M
