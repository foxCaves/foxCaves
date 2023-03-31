local error = error
local next = next
local user_model = require('foxcaves.models.user')
local link_model = require('foxcaves.models.link')
local file_model = require('foxcaves.models.file')
local app_config = require('foxcaves.config').app

if not app_config.enable_testing_routes then return end

R.register_route('/api/v1/system/testing/error', 'GET', R.make_route_opts_anon(), function()
    error('test error')
end)

R.register_route('/api/v1/system/testing/reset', 'POST', R.make_route_opts_anon(), function()
    local users = user_model.get_by_query("lower(username) LIKE 'test_user_%%'")

    local deleted_users = #users
    local deleted_files = 0
    local deleted_links = 0

    for _, user in next, users do
        local links = link_model.get_by_owner(user, true)
        local files = file_model.get_by_owner(user, true)
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