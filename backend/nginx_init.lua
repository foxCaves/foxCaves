local path = require('path')
local root = path.abs(debug.getinfo(1, 'S').source:sub(2):match('(.*/)'))
dofile(root .. '/init.lua')

require('foxcaves.migrator').init()
require('foxcaves.random').init()
require('foxcaves.acme').init()
