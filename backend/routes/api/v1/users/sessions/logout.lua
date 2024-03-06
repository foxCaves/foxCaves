local auth = require('foxcaves.auth')

R.register_route(
    '/api/v1/users/sessions',
    'DELETE',
    R.make_route_opts({
        disable_set_cookies = true,
        disable_api_key = true,
        allow_guest = true,
    }),
    function()
        auth.logout()
        return { ok = true }
    end
)
