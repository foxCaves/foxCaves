local config = require('foxcaves.config').postgres
local consts = require('foxcaves.consts')
local pgmoon = require('pgmoon')
local lfs = require('lfs')
local table = table
local ngx = ngx
local ipairs = ipairs
local io = io
local error = error
local pcall = pcall

local M = {}
require('foxcaves.module_helper').setmodenv()

local function db_query_err(db, query)
    local res, qerr = db:query(query)
    if not res then
        error(qerr)
    end
    return res
end

local function process_migration_dir(db, ran_migrations, dir)
    local file_array = {}
    for file in lfs.dir(dir) do
        local absfile = dir .. '/' .. file
        local attributes = lfs.attributes(absfile)
        if file:sub(1, 1) ~= '.' and attributes.mode == 'file' then
            if ran_migrations[file] then
                ngx.log(ngx.NOTICE, 'Skipping: ' .. file)
            else
                table.insert(file_array, file)
            end
        end
    end
    table.sort(file_array)
    for _, file in ipairs(file_array) do
        local absfile = dir .. '/' .. file
        ngx.log(ngx.NOTICE, 'Running: ' .. file)
        local fh = io.open(absfile, 'r')
        local data = fh:read('*a')
        fh:close()

        local migration_query =
            'BEGIN;\n' .. data .. 'INSERT INTO migrations (name) VALUES (' .. db:escape_literal(file) .. ');\nCOMMIT;'
        db_query_err(db, migration_query)
    end
end

local function setup_db()
    local db = pgmoon.new(config)
    local _, err = db:connect()
    if err then
        error(err)
    end

    db_query_err(db, 'CREATE TABLE IF NOT EXISTS migrations (name VARCHAR(255) PRIMARY KEY);')

    local ran_migrations_arr = db_query_err(db, 'SELECT name FROM migrations;')
    local ran_migrations = {}
    for _, row in ipairs(ran_migrations_arr) do
        ran_migrations[row.name] = true
    end

    process_migration_dir(db, ran_migrations, consts.LUA_ROOT .. '/migrations')

    db:disconnect()
end

local schedule_try_setup_db

local function try_setup_db()
    ngx.log(ngx.NOTICE, 'running migrator...')
    local ok, err = pcall(setup_db)
    if ok then
        ngx.log(ngx.NOTICE, 'migrator done!')
        return
    end

    ngx.log(ngx.ERR, 'failed to run migrator: ', err)
    schedule_try_setup_db()
end

schedule_try_setup_db = function()
    local ok, err = ngx.timer.at(1, try_setup_db)
    if not ok then
        ngx.log(ngx.ERR, 'failed to schedule migrator: ', err)
    end
end

function M.hook_ngx_init_single_worker()
    schedule_try_setup_db()
end

return M
