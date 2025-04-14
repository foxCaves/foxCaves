local cjson = require('cjson')
local config_raw = require('foxcaves.config')
local revision = require('foxcaves.revision')
local ngx = ngx

local config = {
    captcha = {
        registration = false,
        login = false,
        forgot_password = false,
        resend_activation = false,
    },
    totp = {
        secret_bytes = config_raw.totp.secret_bytes or 20,
        issuer = config_raw.totp.issuer or 'foxCaves UNKNOWN',
    },
    urls = {
        main = config_raw.http.main_url,
        cdn = config_raw.http.cdn_url,
    },
    sentry = { dsn = '' },
    backend_revision = revision.hash,
    admin_email = config_raw.email.admin_email,
}

for key, _ in pairs(config.captcha) do
    local value = config_raw.captcha[key]
    if value ~= nil then
        config.captcha[key] = value
    end
end

if config_raw.sentry.dsn_frontend ~= nil then
    config.sentry.dsn = config_raw.sentry.dsn_frontend
end

R.register_route('/api/v1/system/client_config', 'GET', R.make_route_opts_anon(), function()
    return config
end)

R.register_route('/api/v1/system/client_config.js', 'GET', R.make_route_opts_anon(), function()
    ngx.header['Content-Type'] = 'text/javascript'
    ngx.say('"use strict";\nglobalThis.FOXCAVES_CONFIG = ' .. cjson.encode(config) .. ';')
    ngx.eof()
end)
