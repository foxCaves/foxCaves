local path = require('path')
local root = path.abs(debug.getinfo(1, 'S').source:sub(2):match('(.*/)'))
dofile(root .. '/init_worker.lua')

require('foxcaves.acme').init_worker()
