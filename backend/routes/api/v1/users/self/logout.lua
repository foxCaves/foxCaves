register_route("/api/v1/users/self/logout", "POST", make_route_opts({ allow_guest = true, api_login = false }), function()
    do_logout()
end)
