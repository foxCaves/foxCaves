local acme = require('foxcaves.acme')

R.register_route('/.well-known/acme-challenge/{*id}', 'GET', R.make_route_opts_anon(), function()
    acme.serve_http_challenge()
end)
