R.register_route('/api/v1/system/health', 'GET', R.make_route_opts_anon(), function()
    return {
        health = 'ok',
    }
end)
