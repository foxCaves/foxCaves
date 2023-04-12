local config = require('foxcaves.config').captcha
local utils = require('foxcaves.utils')

local M = {}
require('foxcaves.module_helper').setmodenv()

function M.check(page, args)
    if not config[page] then
        return true
    end

    local captcha_response = args.captchaResponse
    if not captcha_response or captcha_response == '' then
        return false
    end

    return true -- TODO: Verify this
end

function M.error()
    return utils.api_error('invalid/missing CAPTCHA')
end

return M
