local utils = require("foxcaves.utils")
local config = require("foxcaves.config").postgres
local pgmoon = require("pgmoon")
local next = next
local error = error
local ngx = ngx
local unpack = unpack
local setmetatable = setmetatable

local M = {}
require("foxcaves.module_helper").setmodenv()

config.socket_type = "nginx"

M.TIME_COLUMNS = 'to_json(updated_at at time zone \'utc\') as updated_at, ' ..
                 'to_json(created_at at time zone \'utc\') as created_at'

local db_meta = {}
function db_meta:query(query, ...)
    local args = {...}
    for i,v in next, args do
        args[i] = self.db:escape_literal(v)
    end
    query = query:format(unpack(args))
    local res, err = self.db:query(query)
    if not res then
        error("Postgres query error: " .. err)
    end
    return res
end

function db_meta:query_single(query, ...)
    local res = self:query(query, ...)
    return res[1]
end

db_meta.__index = db_meta

function M.make()
    local database = pgmoon.new(config)
    local _, err = database:connect()
    if err then
        error("Error connecting to Postgres: " .. err)
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
