local uuid = require('resty.uuid')
local database = require('foxcaves.database')
local events = require('foxcaves.events')

local setmetatable = setmetatable
local next = next

local news_mt = {}
local news_model = {}

require('foxcaves.module_helper').setmodenv()

local function makenewsmt(news)
    database.transfer_time_columns(news, news)
    news.not_in_db = nil
    setmetatable(news, news_mt)
    return news
end

local news_select = 'id, author, editor, title, content, ' .. database.TIME_COLUMNS

function news_model.count_by_query(query, ...)
    local res = database.get_shared():query_single('SELECT COUNT(id) AS count FROM news WHERE ' .. query, nil, ...)
    if not res then
        return 0
    end
    return res.count
end

function news_model.get_by_query(query, options, ...)
    options = options or {}
    if not options.order_by then
        options.order_by = {
            column = 'created_at',
            desc = true,
        }
    end

    local news = database.get_shared():query('SELECT ' .. news_select .. ' FROM news WHERE ' .. query, options, ...)
    for k, v in next, news do
        news[k] = makenewsmt(v)
    end
    return news
end

function news_model.get_by_id(id)
    if not id then
        return nil
    end

    local news = news_model.get_by_query('id = %s', nil, id)
    if news and news[1] then
        return news[1]
    end
    return nil
end

function news_model.new()
    local news = {
        not_in_db = true,
        id = uuid.generate_random(),
        editor = nil,
    }
    setmetatable(news, news_mt)
    return news
end

function news_mt:set_editor(user)
    self.editor = user.id or user
end

function news_mt:set_author(user)
    self.author = user.id or user
end

function news_mt:send_event(action)
    events.push('global', action, 'news', self:get_public())
end

function news_mt:delete()
    if self.not_in_db then return end
    database.get_shared():query('DELETE FROM news WHERE id = %s', nil, self.id)
    self:send_event('delete')
end

function news_mt:save()
    local primary_push_action
    local res =
        database.get_shared():query_single(
            'INSERT INTO news (id, author, editor, title, content) VALUES (%s, %s, %s, %s, %s) ON DUPLICATE KEY UPDATE \
            author = VALUES(author), \
            editor = VALUES(editor), \
            title = VALUES(title), \
            content = VALUES(content) \
            RETURNING ' .. database.TIME_COLUMNS,
            nil,
            self.id,
            self.author,
            self.editor,
            self.title,
            self.content
        )

    if self.not_in_db then
        primary_push_action = 'create'
        self.not_in_db = nil
    else
        primary_push_action = 'update'
    end

    database.transfer_time_columns(self, res)

    self:send_event(primary_push_action)
end

function news_mt:get_public()
    return {
        id = self.id,
        title = self.title,
        content = self.content,
        author = self.author,
        editor = self.editor,
        created_at = self.created_at,
        updated_at = self.updated_at,
    }
end

news_mt.get_private = news_mt.get_public

function news_mt.can_view(_, _)
    return true
end

function news_mt:can_edit(user)
    if not user then
        return false
    end
    if user.id == self.author then
        return true
    end
    if user.id == self.editor then
        return true
    end
    if user:is_admin() then
        return true
    end
    return false
end

function news_model.get_public_fields()
    return {
        id = {
            type = 'uuid',
            required = true,
        },
        author = {
            type = 'uuid',
            required = true,
        },
        editor = {
            type = 'uuid',
            required = true,
        },
        content = {
            type = 'string',
            required = true,
        },
        title = {
            type = 'string',
            required = true,
        },
        created_at = {
            type = 'timestamp',
            required = true,
        },
        updated_at = {
            type = 'timestamp',
            required = true,
        },
    }
end

news_model.get_private_fields = news_model.get_public_fields

news_mt.__index = news_mt

return news_model
