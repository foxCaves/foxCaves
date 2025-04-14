local utils = require('foxcaves.utils')
local link_model = require('foxcaves.models.link')
local ngx = ngx

R.register_route('/fcv-cdn/link/{*link}', 'GET', R.make_route_opts_anon(), function(route_vars)
    local link = link_model.get_by_id(route_vars.link)

    ngx.header['Content-Type'] = 'text/plain'

    if not link then
        return utils.api_error('Link not found: ' .. route_vars.link, 404)
    end

    utils.add_cdn_cache_control()
    ngx.status = 302
    ngx.redirect(link.target)
end)
