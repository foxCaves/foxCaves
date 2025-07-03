local path = require('path')
local root = path.abs(debug.getinfo(1, 'S').source:sub(2):match('(.*/)'))
dofile(root .. '/init.lua')

require('foxcaves.migrator').ngx_init()
require('foxcaves.random').ngx_init()
require('foxcaves.acme').ngx_init()
