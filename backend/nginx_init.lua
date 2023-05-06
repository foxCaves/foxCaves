local path = require('path')
local root = path.abs(debug.getinfo(1, 'S').source:sub(2):match('(.*/)'))
dofile(root .. '/init.lua')

dofile(root .. '/migrator.lua')

require('foxcaves.auto_ssl'):init()
