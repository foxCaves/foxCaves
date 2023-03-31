local redis = require('foxcaves.redis')
local cjson = require('cjson')

local M = {}
require('foxcaves.module_helper').setmodenv()

function M.push_raw(target, data)
    redis.get_shared():publish('push:' .. target, cjson.encode(data))
end

return M