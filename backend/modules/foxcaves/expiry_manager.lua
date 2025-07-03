local expiry_utils = require('foxcaves.expiry_utils')
local link_model = require('foxcaves.models.link')
local file_model = require('foxcaves.models.file')
local ngx = ngx

local delay = require('foxcaves.config').app.expiry_check_period

local M = {}
require('foxcaves.module_helper').setmodenv()

local function handler()
    local links = expiry_utils.delete_expired(link_model)
    local files = expiry_utils.delete_expired(file_model)
    ngx.log(ngx.NOTICE, 'Expired links: ', #links, ', files: ', #files)
end

function M.ngx_init_single_worker()
    local ok, err = ngx.timer.every(delay, handler)
    if not ok then
        ngx.log(ngx.ERR, 'failed to create expiry timer: ', err)
        return
    end

    ngx.log(ngx.NOTICE, 'expiry manager initialized, checking every ', delay, ' seconds')

    ok, err = ngx.timer.at(0, handler) -- Run immediately on startup
    if not ok then
        ngx.log(ngx.ERR, 'failed to schedule initial expiry check: ', err)
        return
    end
end

return M
