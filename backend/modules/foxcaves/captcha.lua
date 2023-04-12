local cjson = require('cjson')
local http = require('resty.http')
local config = require('foxcaves.config').captcha
local utils = require('foxcaves.utils')

local error = error
local ngx = ngx
local tostring = tostring
local table = table

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

    -- https://www.google.com/recaptcha/api/siteverify

    local httpc = http.new()
    local res, err = httpc:request_uri("https://www.google.com/recaptcha/api/siteverify", {
        method = "POST",
        body = ngx.encode_args({
            secret = config.recaptcha_secret_key,
            response = captcha_response,
        }),
        headers = {
            ["Content-Type"] = "application/x-www-form-urlencoded",
        },
    })
    if err then
        error('reCAPTCHA request failed! Error: ' .. tostring(err))
    end

    if res.status ~= 200 then
        error('reCAPTCHA request failed! Status: ' .. tostring(res.status))
    end

    local body = cjson.decode(res.body)
    if not body then
        error('reCAPTCHA request failed! Invalid JSON response')
    end

    if not body.success then
        ngx.log(ngx.INFO, 'reCAPTCHA request failed! Error codes: ' .. table.concat(body['error-codes'] or {'unknown'}, ', '))
        return false
    end

    return true
end

function M.error()
    return utils.api_error('invalid/missing CAPTCHA')
end

return M
