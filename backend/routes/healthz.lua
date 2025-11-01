R.register_route('/healthz', 'GET', R.make_route_opts_anon(), function()
    return { health = 'OK' }
end)
