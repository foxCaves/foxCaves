R.register_route('/api/v1/system/health', 'GET', R.make_route_opts_anon(), function()
    return { health = 'OK' }
end)

R.register_route('/api/v1/system/ready', 'GET', R.make_route_opts_anon(), function()
    return { ready = 'OK' }
end)
