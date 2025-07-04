local expiry_utils = require('foxcaves.expiry_utils')
local link_model = require('foxcaves.models.link')
local file_model = require('foxcaves.models.file')
local hooks = require('foxcaves.hooks')
local delay = require('foxcaves.config').app.expiry_check_period
local ngx = ngx

local M = {}
require('foxcaves.module_helper').setmodenv()

local function handler()
    local links = expiry_utils.delete_expired(link_model)
    local files = expiry_utils.delete_expired(file_model)
    ngx.log(ngx.NOTICE, 'Expired links: ', #links, ', files: ', #files)
    hooks.call('context_end')
end

hooks.register_global('database_ready', function()
    local ok, err = ngx.timer.every(delay, handler)
    if not ok then
        ngx.log(ngx.ERR, 'failed to create expiry timer: ', err)
        return
    end

    ngx.log(ngx.NOTICE, 'expiry manager initialized, checking every ', delay, ' seconds')

    ok, err = ngx.timer.at(1, handler)
    if not ok then
        ngx.log(ngx.ERR, 'failed to schedule initial expiry check: ', err)
        return
    end
end)

return M
