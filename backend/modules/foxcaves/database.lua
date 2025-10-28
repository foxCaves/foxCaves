local config = require('foxcaves.config').mysql
local hooks = require('foxcaves.hooks')
local mysql = require('resty.mysql')
local error = error
local ngx = ngx
local unpack = unpack
local setmetatable = setmetatable
local select = select

local M = {}
require('foxcaves.module_helper').setmodenv()

M.TIME_COLUMNS = 'JSON_VALUE(updated_at, "$") as updated_at_str, JSON_VALUE(created_at, "$") as created_at_str'
M.TIME_COLUMNS_EXPIRING = 'JSON_VALUE(expires_at, "$") as expires_at_str, ' .. M.TIME_COLUMNS

local db_meta = {}
function db_meta:query(query, options, ...)
    local args = {
        n = select('#', ...),
        ...,
    }
    if args.n > 0 then
        local db_args = {}
        for i = 1, args.n do
            local v = args[i]
            if v == nil or v == ngx.null then
                db_args[i] = 'NULL'
            else
                db_args[i] = ngx.quote_sql_str(v)
            end
        end
        query = query:format(unpack(db_args))
    end

    if options then
        if options.order_by then
            local res = ngx.re.match(options.order_by.column, '^[a-z_]+$', 'o')
            if not res then
                error('Invalid order_by column: ' .. options.order_by.column)
            end

            query =
                query .. ' ORDER BY `' .. options.order_by.column .. '` ' .. (options.order_by.desc and 'DESC' or 'ASC')
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
        error('MySQL query error: ' .. err .. '! During query: ' .. query)
    end
    return res
end

function db_meta:query_single(query, options, ...)
    local res = self:query(query, options, ...)
    return res[1]
end

db_meta.__index = db_meta

function M.make()
    local database, err = mysql:new()
    if not database then
        error('Error creating MySQL object: ' .. err)
    end
    local ok
    ok, err = database:connect(config)
    if not ok then
        error('Error connecting to MySQL: ' .. err)
    end

    hooks.register_ctx('context_end', function()
        database:set_keepalive(config.keepalive_timeout or 10000, config.keepalive_count or 10)
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
