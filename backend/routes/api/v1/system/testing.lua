local env = require('foxcaves.env')
local consts = require('foxcaves.consts')
if env.id ~= consts.ENV_TESTING and env.id ~= consts.ENV_DEVELOPMENT then return end

local error = error
local next = next
local user_model = require('foxcaves.models.user')
local link_model = require('foxcaves.models.link')
local file_model = require('foxcaves.models.file')
local news_model = require('foxcaves.models.news')
local database = require('foxcaves.database')

local ngx = ngx

ngx.log(ngx.WARN, 'TESTING ROUTES ENABLED')

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

    local news = news_model.get_by_query("lower(title) LIKE 'test_news_%%'")
    local deleted_news = #news
    for _, news_item in next, news do
        news_item:delete()
    end

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
        deleted_news = deleted_news,
    }
end)

R.register_route('/api/v1/system/testing/promote', 'POST', R.make_route_opts(), function()
    database.get_shared():query('UPDATE users SET admin = 1 WHERE id = %s', nil, ngx.ctx.user.id)

    return 'TEST PROMOTION SUCCESSFUL'
end)
