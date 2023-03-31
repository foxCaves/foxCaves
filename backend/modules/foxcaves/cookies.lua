local config = require('foxcaves.config').cookies
local resty_cookie = require('resty.cookie')

local ngx = ngx

local M = {}
require('foxcaves.module_helper').setmodenv()

local function get_instance()
    if ngx.ctx.__cookies then
        return ngx.ctx.__cookies
    end

    local cookies = resty_cookie:new(config)
    ngx.ctx.__cookies = cookies
    return cookies
end

function M.get(cookie)
    return get_instance():get(cookie)
end

function M.set(cookie)
    if ngx.ctx.route_opts.disable_set_cookies then return end
    return get_instance():set(cookie)
end

function M.delete(cookie)
    return get_instance():delete(cookie)
end

return M