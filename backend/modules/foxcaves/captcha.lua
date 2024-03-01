local config = require('foxcaves.config').captcha
local utils = require('foxcaves.utils')
local random = require('foxcaves.random')
local redis = require('foxcaves.redis')
local gd = require('gd')

local error = error
local ngx = ngx
local tostring = tostring
local tonumber = tonumber
local math = math

local font_name = config.font_name or OSENV.CAPTCHA_FONT
local captcha_timeout = config.timeout
local font_size = config.font_size
local width = config.width
local height = config.height
local angle_max_dev = math.rad(config.angle_max)
local code_length = config.code_length

local M = {}
require('foxcaves.module_helper').setmodenv()

local captcha_chars =
    {
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
        '9',
    }

local function generate_verify_code(page, id, time, response)
    return ngx.encode_base64(ngx.hmac_sha1(id .. '/' .. tostring(time) .. '/' .. page, response:upper()))
end

local letter_spacing = width / code_length
local font_size_half = font_size / 2

local captcha_char_sizes = {}
for i = 1, #captcha_chars do
    local img = gd.createTrueColor(64, 64)
    local color = img:colorAllocate(255, 255, 255)
    img:stringFT(color, font_name, 36, 0, 0, 36, captcha_chars[i])
    local llx, _, lrx, lry, _, ury, _, _ = img:stringFT(color, font_name, font_size, 0, 0, font_size, captcha_chars[i])
    local info = {
        width = lrx - llx,
        height = lry - ury,
    }
    info.width_half = info.width / 2
    info.height_half = info.height / 2
    captcha_char_sizes[captcha_chars[i]] = info
end

local angle_max_dev_double = angle_max_dev * 2
local function generate_image(text)
    local img = gd.createTrueColor(width, height)

    --local background = img:colorAllocate(0, 0, 0)
    --img:filledRectangle(0, 0, width - 1, height - 1, background)

    local random_colors =
        {
            img:colorAllocate(255, 0, 0),
            img:colorAllocate(0, 255, 0),
            img:colorAllocate(0, 0, 255),
            img:colorAllocate(255, 255, 0),
            img:colorAllocate(255, 0, 255),
            img:colorAllocate(0, 255, 255),
        }

    for i = 1, code_length do
        local char = text:sub(i, i)
        local size = captcha_char_sizes[char]

        local x = (i - 1) * letter_spacing + math.random(0, letter_spacing - size.width)
        local y = math.random(font_size, height - (size.height_half - font_size_half))
        local angle = (math.random() * angle_max_dev_double) - angle_max_dev
        local color = random_colors[math.random(1, #random_colors)]
        img:stringFT(color, font_name, font_size, angle, x, y, char)
    end

    return 'data:image/png;base64,' .. ngx.encode_base64(img:pngStr())
end

function M.generate(page)
    if not config[page] then
        return {}
    end

    local id = random.string(32)
    local code = random.string(code_length, captcha_chars)
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

    local redis_key = 'captcha:' .. id

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
