local expiry_utils = require('foxcaves.expiry_utils')
local link_model = require('foxcaves.models.link')
local file_model = require('foxcaves.models.file')
local ngx = ngx

local delay = require('foxcaves.config').app.expiry_check_period

local M = {}
require('foxcaves.module_helper').setmodenv()

local running = false
local start

local function handler(premature)
    if not premature then
        running = false
        start()
    end

    local links = expiry_utils.delete_expired(link_model)
    local files = expiry_utils.delete_expired(file_model)
    ngx.log(ngx.NOTICE, "Expired links: ", #links, ", files: ", #files)
 end

start = function()
    if running then
        return
    end

    local ok, err = ngx.timer.at(delay, handler)
    if not ok then
        ngx.log(ngx.ERR, "failed to create expiry timer: ", err)
        return
    end
    running = true
end

function M.init()
    start()
    handler(true)
end

return M
