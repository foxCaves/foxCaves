local utils = require('foxcaves.utils')
local news_model = require('foxcaves.models.news')
local ngx = ngx

R.register_route(
    '/api/v1/news/{news}',
    'GET',
    R.make_route_opts_anon(),
    function(route_vars)
        local news = news_model.get_by_id(route_vars.news)
        if not news then
            return utils.api_error('News not found', 404)
        end
        if not news:can_view(ngx.ctx.user) then
            return utils.api_error('You do not have permission to view this news', 403)
        end
        return news:get_public()
    end,
    {
        description = 'Get information about a news item',
        authorization = { 'anonymous' },
        request = {
            params = {
                news = {
                    type = 'string',
                    description = 'The id of the news',
                },
            },
        },
        response = {
            body = { type = 'news.public' },
        },
    }
)
