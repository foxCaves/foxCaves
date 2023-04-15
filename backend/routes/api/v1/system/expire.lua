local expiry_utils = require('foxcaves.expiry_utils')
local link_model = require('foxcaves.models.link')
local file_model = require('foxcaves.models.file')

R.register_route('/api/v1/system/expire', 'POST', R.make_route_opts({
    check_login = false,
    allow_guest = true,
    disable_csrf_checks = true,
}), function()
    local links = expiry_utils.delete_expired(link_model)
    local files = expiry_utils.delete_expired(file_model)

    return {
        links = #links,
        files = #files,
    }
end)
