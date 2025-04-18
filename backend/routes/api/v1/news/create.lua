local utils = require('foxcaves.utils')
local news_model = require('foxcaves.models.news')
local ngx = ngx

R.register_route(
    '/api/v1/news',
    'POST',
    R.make_route_opts(),
    function()
        if not ngx.ctx.user:is_admin() then
            return utils.api_error('You are not an admin', 403)
        end

        local news = news_model.new()
        news:set_author(ngx.ctx.user)

        local args = utils.get_post_args()
        news.title = args.title or ''
        news.content = args.content or ''

        if news.title == '' then
            return utils.api_error('No title')
        end
        if news.content == '' then
            return utils.api_error('No content')
        end

        news:save()

        return news:get_private()
    end,
    {
        description = 'Creates a news item',
        authorization = { 'admin' },
        request = {
            body = {
                type = 'object',
                required = true,
                fields = {
                    title = {
                        type = 'string',
                        description = 'The title of the news item',
                        required = true,
                    },
                    content = {
                        type = 'string',
                        description = 'The content of the news item',
                        required = true,
                    },
                },
            },
        },
        response = {
            body = { type = 'news.private' },
        },
    }
)
