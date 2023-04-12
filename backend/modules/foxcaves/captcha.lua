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

local function send_recaptcha_verify(captcha_response)
    local httpc = http.new()
    local res, err = httpc:request_uri('https://www.google.com/recaptcha/api/siteverify', {
        method = 'POST',
        body = ngx.encode_args({
            secret = config.recaptcha_secret_key,
            response = captcha_response,
        }),
        headers = { ['Content-Type'] = 'application/x-www-form-urlencoded' },
    })
    if err then
        return nil, ('Error: ' .. tostring(err))
    end

    if res.status ~= 200 then
        return nil, ('Status: ' .. tostring(res.status))
    end

    local body = cjson.decode(res.body)
    if not body then
        return nil, 'Invalid JSON response'
    end

    return body, nil
end

function M.check(page, args)
    if not config[page] then
        return true
    end

    local captcha_response = args.captchaResponse
    if not captcha_response or captcha_response == '' then
        return false
    end

    local retries = 3
    local body, err
    while retries > 0 do
        retries = retries - 1
        body, err = send_recaptcha_verify(captcha_response)
        if err then
            err = 'reCAPTCHA request failed! ' .. err
            ngx.log(ngx.ERR, err)
            ngx.sleep(0.5)
        end
    end
    if err ~= nil then
        error(err)
    end

    if not body.success then
        ngx.log(
            ngx.INFO,
            'reCAPTCHA verification failed! Error code(s): ' .. table.concat(body['error-codes'] or { 'unknown' }, ', ')
        )
        return false
    end

    return true
end

function M.error()
    return utils.api_error('invalid or missing CAPTCHA')
end

return M
