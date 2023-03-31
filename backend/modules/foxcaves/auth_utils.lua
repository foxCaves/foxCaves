local b64 = require('ngx.base64')
local cookies = require('foxcaves.cookies')
local insecure_login_keys = require('foxcaves.config').app.insecure_login_keys

local ngx = ngx

local M = {}
require('foxcaves.module_helper').setmodenv()

local LOGIN_KEY_MAX_AGE = 30 * 24 * 60 * 60

function M.hash_login_key(login_key)
    local login_key_hmac = ngx.var.http_user_agent or ngx.var.remote_addr
    if insecure_login_keys then
        login_key_hmac = 'login_key_dummy'
    end
    return ngx.hmac_sha1(login_key or ngx.ctx.user.login_key, login_key_hmac)
end

function M.send_login_key()
    if not ngx.ctx.user or not ngx.ctx.remember_me then return end

    cookies.set({
        key = 'login_key',
        value = ngx.ctx.user.id .. '.' .. b64.encode_base64url(M.hash_login_key()),
        max_age = LOGIN_KEY_MAX_AGE,
    })
end

return M