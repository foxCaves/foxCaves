local auth = require('foxcaves.auth')
local main_url = require('foxcaves.config').http.main_url
local ngx = ngx

R.register_route('/api/v1/users/sessions/logout', 'GET', R.make_route_opts({ allow_guest = true }), function()
    auth.logout()
    ngx.status = 302
    ngx.redirect(main_url)
end)