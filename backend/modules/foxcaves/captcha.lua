local cjson = require('cjson')
local http = require('resty.http')
local config = require('foxcaves.config').captcha
local utils = require('foxcaves.utils')
local random = require('foxcaves.random')
local exec = require('foxcaves.exec')

local error = error
local ngx = ngx
local tostring = tostring
local table = table

local M = {}
require('foxcaves.module_helper').setmodenv()

local captcha_chars = {
    'A',
    'B',
    'C',
    'D',
    'E',
    'F',
    'G',
    'H',
    'i',
    'J',
    'K',
    'L',
    'M',
    'N',
    'P',
    'Q',
    'R',
    'S',
    'T',
    'U',
    'V',
    'W',
    'X',
    'Y',
    'Z',
    '2',
    '3',
    '4',
    '5',
    '6',
    '7',
    '8',
    '9'
}

local captcha_timeout = 5 * 60

local function generate_verify_code(page, args)
    if not (args and args.captchaId and args.captchaTime and args.captchaCode) then
        return nil
    end
    local captcha_time = tonumber(args.captchaTime)
    local captcha_age = ngx.time() - captcha_time
    if captcha_age > captcha_timeout then
        return nil
    end

    return ngx.hmac_sha1(args.captchaID .. "/" .. tostring(args.captchaTime) .. "/" .. args.captchaCode, args.captchaCode)
end

local function generate_image(text)
    local res = exec.cmd(
        'qrencode',
        '-t',
        'png',
        '-o',
        '-',
        text
    )
    if not (res and res.ok) then
        return nil
    end
    return "data:image/png;base64," .. ngx.encode_base64(res.stdout)
end

function M.generate(page)
    if not config[page] then
        return {}
    end

    local id = random.string(32)
    local code = random.string(8, captcha_chars)

    return {
        time = ngx.time(),
        id = id,
        token = generate_verify_code(page, { captchaId = id, captchaTime = time, captchaCode = code }),
        image = generate_image(code),
    }
end

function M.check(page, args)
    if not config[page] then
        return true
    end

    local correct_code = generate_verify_code(page, args)
    if not correct_code then
        return false
    end

    return correct_code == args.captchaToken
end

function M.error()
    return utils.api_error('invalid or missing CAPTCHA')
end

return M
