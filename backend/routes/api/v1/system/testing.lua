local error = error
local next = next
local user_model = require('foxcaves.models.user')
local link_model = require('foxcaves.models.link')
local file_model = require('foxcaves.models.file')
local app_config = require('foxcaves.config').app
local totp = require('foxcaves.totp')

if not app_config.enable_testing_routes then return end

local testing_opts = R.make_route_opts({
    check_login = false,
    allow_guest = true,
    disable_csrf_checks = true,
})

R.register_route('/api/v1/system/testing/error', 'GET', testing_opts, function()
    error('test error <u>&escaping</u>')
end)

R.register_route('/api/v1/system/testing/reset', 'POST', testing_opts, function()
    local users = user_model.get_by_query("lower(username) LIKE 'test_user_%%'")

    local deleted_users = #users
    local deleted_files = 0
    local deleted_links = 0

    for _, user in next, users do
        local links = link_model.get_by_owner(user, { all = true })
        local files = file_model.get_by_owner(user, { all = true })
        for _, link in next, links do
            link:delete()
        end
        for _, file in next, files do
            file:delete()
        end
        user:delete()
        deleted_links = deleted_links + #links
        deleted_files = deleted_files + #files
    end

    return {
        deleted_users = deleted_users,
        deleted_files = deleted_files,
        deleted_links = deleted_links,
    }
end)
