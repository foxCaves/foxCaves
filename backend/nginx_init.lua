local path = require('path')
local root = path.abs(debug.getinfo(1, 'S').source:sub(2):match('(.*/)'))
dofile(root .. '/init.lua')

dofile(root .. '/autoloader.lua')

local hooks = require('foxcaves.hooks')
hooks.call('ngx_init')
