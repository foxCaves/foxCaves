local config = require('foxcaves.config').postgres
local consts = require('foxcaves.consts')
local pgmoon = require('pgmoon')
local lfs = require('lfs')

local function process_migration_dir(db, ran_migrations, dir)
    local file_array = {}
    for file in lfs.dir(dir) do
        local absfile = dir .. '/' .. file
        local attributes = lfs.attributes(absfile)
        if file:sub(1, 1) ~= '.' and attributes.mode == 'file' then
            if ran_migrations[file] then
                print('Skipping: ' .. file)
            else
                table.insert(file_array, file)
            end
        end
    end
    table.sort(file_array)
    for _, file in ipairs(file_array) do
        local absfile = dir .. '/' .. file
        print('Running: ' .. file)
        local fh = io.open(absfile, 'r')
        local data = fh:read('*a')
        fh:close()
        db:query_err(data)
        db:query_err('INSERT INTO migrations (name) VALUES (' .. db:escape_literal(file) .. ');')
    end
end
local function setup_db()
    local db = pgmoon.new(config)
    local _, err = db:connect()
    if err then
        error(err)
    end

    function db:query_err(query)
        local res, qerr = self:query(query)
        if not res then
            error(qerr)
        end
        return res
    end

    db:query_err('CREATE TABLE IF NOT EXISTS migrations (name VARCHAR(255) PRIMARY KEY);')

    local ran_migrations_arr = db:query_err('SELECT name FROM migrations;')
    local ran_migrations = {}
    for _, row in ipairs(ran_migrations_arr) do
        ran_migrations[row.name] = true
    end

    process_migration_dir(db, ran_migrations, consts.LUA_ROOT .. '/migrations')

    db:disconnect()
end

if config.use_migrations then
    print('Running migrator...')
    setup_db()
    print('Migrator done!')
end