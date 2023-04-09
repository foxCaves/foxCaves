local cookies = require('foxcaves.cookies')
local random = require('foxcaves.random')

local ngx = ngx

local CSRF_COOKIE_NAME = 'csrf_token'
local CSRF_COOKIE_EXPIRE = 24 * 60 * 60

local M = {}
require('foxcaves.module_helper').setmodenv()

function M.set()
    local val = cookies.get(CSRF_COOKIE_NAME)
    if not val then
        val = random.string(32)
    end

    cookies.set({
        key = CSRF_COOKIE_NAME,
        value = val,
        max_age = CSRF_COOKIE_EXPIRE,
    })

    ngx.header['CSRF-Token'] = val
end

function M.check(token)
    if not token then
        return false
    end

    local val = cookies.get(CSRF_COOKIE_NAME)
    if not val then
        return false
    end

    return val == token
end

return M
