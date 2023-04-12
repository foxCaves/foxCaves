local config_raw = require('foxcaves.config')
local cjson = require('cjson')
local ngx = ngx

local config = {
    captcha = {},
    sentry = { dsn = nil },
}

for key, default_value in
    pairs({
        registration = false,
        login = false,
        forgot_password = false,
        resend_activation = false,
        recaptcha_site_key = '',
    })
do
    local value = config_raw.captcha[key]
    if value == nil then
        value = default_value
    end
    config.captcha[key] = value
end

config.sentry.dsn = config_raw.sentry.dsn_frontend

R.register_route('/api/v1/system/client_config', 'GET', R.make_route_opts_anon(), function()
    return config
end)

R.register_route('/api/v1/system/client_config.js', 'GET', R.make_route_opts_anon(), function()
    ngx.header['Content-Type'] = 'text/javascript'
    ngx.say('window.foxcavesConfig = ' .. cjson.encode(config))
    ngx.eof()
end)
