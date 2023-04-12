local config_raw = require('foxcaves.config')
local cjson = require('cjson')
local ngx = ngx

local config = {
    captcha = {
        registration = false,
        login = false,
        forgot_password = false,
        resend_activation = false,
        recaptcha_site_key = '',
    },
    sentry = { dsn = '' },
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
    ngx.say('"use strict";\nwindow.FOXCAVES_CONFIG = ' .. cjson.encode(config) .. ';')
    ngx.eof()
end)
