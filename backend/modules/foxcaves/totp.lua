local base_encoding = require('resty.base_encoding')
local ffi = require('ffi')
local string = string
local ngx = ngx
local bit = bit
local math = math
local config = require('foxcaves.config').totp or {}
local random = require('foxcaves.random')

local max_past = config.max_past or 1
local max_future = config.max_future or 1
local max_iterator_max = math.max(max_past, max_future)

local is_little = ffi.abi('le')
local uint32_union = ffi.typeof [[
  union {
    char bytes[4];
    uint32_t uint32;
  }
]]
local uint64_union = ffi.typeof [[
  union {
    char bytes[8];
    struct {
        uint32_t uint32_hi;
        uint32_t uint32_lo;
    };
    uint64_t uint64;
  }
]]

local M = {}
require('foxcaves.module_helper').setmodenv()

local function totp_counter()
    return math.floor(ngx.time() / 30)
end

local function hotp(secret, counter)
    local counter_union = uint64_union { uint64 = counter }

    if is_little then
        local tmp = bit.bswap(counter_union.uint32_hi)
        counter_union.uint32_hi = bit.bswap(counter_union.uint32_lo)
        counter_union.uint32_lo = tmp
    end

    local secret_b, err = base_encoding.decode_base32(secret)
    if not secret_b then
        error('Invalid secret: ' .. err)
    end
    local hmac = ngx.hmac_sha1(secret_b, ffi.string(counter_union.bytes, 8))
    local least4 = bit.band(string.byte(hmac, 20), 0x0F)

    -- Extract 31 bits (hence the band)
    local dbi_union = uint32_union { bytes = string.sub(hmac, least4 + 1, least4 + 4) }
    local dbi = dbi_union.uint32
    if is_little then
        dbi = bit.bswap(dbi)
    end
    dbi = bit.band(dbi, 0x7FFFFFFF)

    -- Truncate to 6 digit codes
    return dbi % 1000000
end

function M.generate(secret)
    return hotp(secret, totp_counter())
end

function M.check(secret, code)
    local real = totp_counter()
    if hotp(secret, real) == code then
        return true
    end

    -- Check past/future inside-out, starting with first past
    for i = 1, max_iterator_max do
        if i <= max_past and hotp(secret, real - i) == code then
            return true
        end
        if i <= max_future and hotp(secret, real + i) == code then
            return true
        end
    end

    return false
end

function M.new_secret()
    return base_encoding.encode_base32(random.bytes(20))
end

return M
