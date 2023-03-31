local config = require('foxcaves.config').cookies
local resty_cookie = require('resty.cookie')

local ngx = ngx

local M = {}
require('foxcaves.module_helper').setmodenv()

function M.get_instance()
    if ngx.ctx.__cookies then
        return ngx.ctx.__cookies
    end

    local cookies = resty_cookie:new(config)
    ngx.ctx.__cookies = cookies
    return cookies
end

return M