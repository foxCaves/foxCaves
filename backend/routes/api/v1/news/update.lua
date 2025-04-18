local utils = require('foxcaves.utils')
local news_model = require('foxcaves.models.news')
local user_model = require('foxcaves.models.user')
local ngx = ngx

R.register_route(
    '/api/v1/news/{news}',
    'PATCH',
    R.make_route_opts(),
    function(route_vars)
        local news = news_model.get_by_id(route_vars.news)
        if not news then
            return utils.api_error('News not found', 404)
        end
        if not news:can_edit(ngx.ctx.user) then
            return utils.api_error('You do not have permission to edit this news', 403)
        end

        local args = utils.get_post_args()

        local had_edits = false
        if args.title and args.title ~= '' and args.title ~= news.title then
            news.title = args.title
            had_edits = true
        end
        if args.content and args.content ~= '' and args.content ~= news.content then
            news.content = args.content
            had_edits = true
        end
        if args.author and args.author ~= '' and ngx.ctx.user:is_admin() then
            local author = user_model.get_by_id(args.author)
            if not author then
                return utils.api_error('New author not found')
            end
            news:set_author(author)
            had_edits = true
        end

        if had_edits then
            news:set_editor(ngx.ctx.user)
            news:save()
        end

        return news:get_private()
    end,
    {
        description = 'Updates information about a news item',
        authorization = { 'author', 'editor' },
        request = {
            params = {
                news = {
                    type = 'string',
                    description = 'The id of the news',
                },
            },
            body = {
                type = 'object',
                required = true,
                fields = {
                    title = {
                        type = 'string',
                        description = 'The new title of the news item',
                        required = false,
                    },
                    content = {
                        type = 'string',
                        description = 'The new content of the news item',
                        required = false,
                    },
                    author = {
                        type = 'uuid',
                        description = 'The new author of the news item (admin only)',
                        required = false,
                    },
                },
            },
        },
        response = {
            body = { type = 'news.private' },
        },
    }
)
