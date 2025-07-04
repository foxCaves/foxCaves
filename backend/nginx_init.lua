local path = require('path')
local root = path.abs(debug.getinfo(1, 'S').source:sub(2):match('(.*/)'))
dofile(root .. '/includes/init.lua')

dofile(root .. '/includes/autoloader.lua')

local executor_name = require('foxcaves.config').app.executor
ngx.log(ngx.NOTICE, 'Using executor: ', executor_name)
rawset(_G, 'foxcaves_executor', dofile(root .. '/includes/executors/' .. executor_name .. '.lua'))

local hooks = require('foxcaves.hooks')
hooks.call('ngx_init')
