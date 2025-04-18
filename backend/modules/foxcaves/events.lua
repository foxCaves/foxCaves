local redis = require('foxcaves.redis')
local cjson = require('cjson')

local M = {}
require('foxcaves.module_helper').setmodenv()

function M.push(target, action, model, data)
    M.push_raw(target, {
        type = 'liveLoading',
        action = action,
        model = model,
        data = data,
    })
end

function M.push_raw(target, data)
    redis.get_shared():publish('push:' .. target, cjson.encode(data))
end

return M
