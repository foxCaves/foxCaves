local setfenv = setfenv

local path = require('path')
local root = path.abs(debug.getinfo(1, 'S').source:sub(2):match('(.*/)'))
dofile(root .. '/includes/init.lua')

dofile(root .. '/includes/autoloader.lua')

local executor_name = require('foxcaves.config').app.executor
ngx.log(ngx.NOTICE, 'Using executor: ', executor_name)
local executor = dofile(root .. '/includes/executors/' .. executor_name .. '.lua')
setfenv(executor, require('foxcaves.module_helper').make_empty_table('EXECUTOR'))
rawset(_G, 'foxcaves_executor', executor)

local hooks = require('foxcaves.hooks')
hooks.call('ngx_init')
