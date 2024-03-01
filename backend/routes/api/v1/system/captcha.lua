local captcha = require('foxcaves.captcha')

R.register_route(
    '/api/v1/system/captcha/{page}',
    'POST',
    R.make_route_opts({
        check_login = false,
        allow_guest = true,
    }),
    function(route_vars)
        return captcha.generate(route_vars.page)
    end
)
