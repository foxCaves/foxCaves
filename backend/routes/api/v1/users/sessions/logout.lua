local auth = require("foxcaves.auth")

R.register_route("/api/v1/users/sessions/logout", "POST", R.make_route_opts({ allow_guest = true }), function()
    auth.logout()
end)
