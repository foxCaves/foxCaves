local auth = require("foxcaves.auth")

R.register_route("/api/v1/users/self/logout", "POST",
                    R.make_route_opts({ allow_guest = true, api_login = false }), function()
    auth.logout()
end)
