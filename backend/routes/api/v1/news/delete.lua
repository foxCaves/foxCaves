local utils = require('foxcaves.utils')
local news_model = require('foxcaves.models.news')
local ngx = ngx

R.register_route(
    '/api/v1/news/{news}',
    'DELETE',
    R.make_route_opts(),
    function(route_vars)
        local news = news_model.get_by_id(route_vars.news)
        if not news then
            return utils.api_error('News not found', 404)
        end
        if not news:can_edit(ngx.ctx.user) then
            return utils.api_error('You do not have permission to edit this news', 403)
        end
        news:delete()
        return news:get_private()
    end,
    {
        description = 'Deletes a news item',
        authorization = { 'author', 'editor' },
        request = {
            params = {
                news = {
                    type = 'string',
                    description = 'The id of the news',
                },
            },
        },
        response = {
            body = { type = 'news.private' },
        },
    }
)
