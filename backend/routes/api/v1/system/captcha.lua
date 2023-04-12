local captcha_config_raw = require('foxcaves.config').captcha or {}

local allowed_keys = {
    registration = false,
    login = false,
    forgot_password = false,
    resend_activation = false,
    recaptcha_site_key = '',
}

local captcha_config = {}

for key, default_value in pairs(allowed_keys) do
    local value = captcha_config_raw[key]
    if value == nil then
        value = default_value
    end
    captcha_config[key] = value
end

R.register_route('/api/v1/system/captcha', 'GET', R.make_route_opts_anon(), function()
    return captcha_config
end)
