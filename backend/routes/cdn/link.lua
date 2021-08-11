local utils = require("utils")
local database = require("database")

register_route("/cdn/link/{linkid}", "GET", make_route_opts_anon(), function()
    local dest = database.get_shared():query_safe('SELECT url FROM links WHERE id = %s', ngx.ctx.route_vars.linkid)
    dest = dest[1]

    ngx.header["Content-Type"] = "text/plain"

    if not dest then
        return utils.api_error("Link not found", 404)
    end

    ngx.status = 302
    ngx.redirect(dest.url)
end)
