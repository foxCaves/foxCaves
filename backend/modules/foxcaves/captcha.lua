local cjson = require('cjson')
local http = require('resty.http')
local config = require('foxcaves.config').captcha
local utils = require('foxcaves.utils')
local random = require('foxcaves.random')
local exec = require('foxcaves.exec')
local redis = require('foxcaves.redis')

local error = error
local ngx = ngx
local tostring = tostring
local tonumber = tonumber
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

local function generate_verify_code(page, id, time, response)
    return ngx.encode_base64(ngx.hmac_sha1(id .. "/" .. tostring(time) .. "/" .. page, response:upper()))
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
    local time = ngx.now()

    return {
        time = time,
        id = id,
        token = generate_verify_code(page, id, time, code),
        image = generate_image(code),
    }
end

function M.check(page, args)
    if not config[page] then
        return true
    end

    if not (args and args.captchaId and args.captchaTime and args.captchaResponse) then
        return false
    end

    local id = args.captchaId
    local time = tonumber(args.captchaTime)
    local response = args.captchaResponse

    local captcha_age = ngx.now() - time
    if captcha_age > captcha_timeout then
        return false
    end

    local redis_key = "captcha:" .. id

    local redis_inst = redis.get_shared()
    local res = redis_inst:exists(redis_key)
    if utils.is_falsy_or_null(res) then
        error('redis error')
    end
    if res > 0 then -- already used
        return false
    end

    local correct_code = generate_verify_code(page, id, time, response)
    if not correct_code then
        return false
    end

    -- ensure that the captcha can only be used once (even if wrong!)
    res = redis_inst:set(redis_key, tostring(ngx.now()), 'ex', captcha_timeout)
    if utils.is_falsy_or_null(res) then
        error('redis error')
    end
    return correct_code == args.captchaToken
end

function M.error()
    return utils.api_error('invalid or missing CAPTCHA')
end

return M
