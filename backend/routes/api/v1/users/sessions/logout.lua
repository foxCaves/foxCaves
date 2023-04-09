local auth = require('foxcaves.auth')
local main_url = require('foxcaves.config').http.main_url
local ngx = ngx

R.register_route(
    '/api/v1/users/sessions',
    'DELETE',
    R.make_route_opts({
        disable_set_cookies = true,
        allow_guest = true,
    }),
    function()
        auth.logout()
        return { ok = true }
    end
)
