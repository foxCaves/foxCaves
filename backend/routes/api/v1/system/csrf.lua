local csrf = require('foxcaves.csrf')

R.register_route(
    '/api/v1/system/csrf',
    'POST',
    R.make_route_opts({
        check_login = false,
        allow_guest = true,
        disable_csrf_checks = true,
    }),
    function()
        return { csrf_token = csrf.set() }
    end
)
