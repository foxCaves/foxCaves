local utils = require('foxcaves.utils')
local WS_URL = ngx.re.gsub(require('foxcaves.config').http.app_url, '^http', 'ws', 'o')

local ngx = ngx

R.register_route(
    '/api/v1/files/{file}/live_draw',
    'GET',
    R.make_route_opts({ allow_guest = true }),
    function(route_vars)
        local session = ngx.var.arg_session
        if not session then
            return utils.api_error('Missing session', 400)
        end

        return { url = WS_URL .. '/api/v1/ws/live_draw?file=' .. route_vars.file .. '&session=' .. session }
    end,
    {}
)
