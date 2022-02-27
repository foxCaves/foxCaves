local database = require("foxcaves.database")
local random = require("foxcaves.random")
local url_config = require("foxcaves.config").urls
local user_model = require("foxcaves.models.user")

local setmetatable = setmetatable
local next = next

local link_mt = {}
local link_model = {}

require("foxcaves.module_helper").setmodenv()

local function makelinkmt(link)
    link.not_in_db = nil
    setmetatable(link, link_mt)
    return link
end

local link_select = 'id, owner, url, expires_at, ' .. database.TIME_COLUMNS_EXPIRING

function link_model.get_by_query(query, ...)
    local links = database.get_shared():query('SELECT ' .. link_select .. ' FROM links ' ..
                                              'WHERE (expires_at IS NULL OR expires_at >= NOW()) AND ' ..
                                              '(' .. query .. ')', ...)
    for k,v in next, links do
        links[k] = makelinkmt(v)
    end
    return links
end

function link_model.get_by_user(user)
    if not user then
        return {}
    end

    if user.id then
        user = user.id
    end

    return link_model.get_by_query('owner = %s', user)
end

function link_model.get_by_id(id)
    if not id then
        return nil
    end

    local links = link_model.get_by_query('id = %s', id)
    if links and links[1] then
        return makelinkmt(links[1])
    end
    return nil
end

function link_model.new()
    local link = {
        not_in_db = true,
        id = "g" .. random.string(10),
    }
    setmetatable(link, link_mt)
    return link
end

function link_mt:delete()
    database.get_shared():query('DELETE FROM links WHERE id = %s', self.id)

    local owner = user_model.get_by_id(self.owner)
    owner:send_event('delete', 'link', self:get_private())
end

function link_mt:set_owner(user)
    self.owner = user.id or user
end

function link_mt:set_url(url)
    self.url = url
    return true
end

function link_mt:save()
    local res, primary_push_action
    if self.not_in_db then
        res = database.get_shared():query_single(
            'INSERT INTO links (id, owner, url, expires_at) VALUES (%s, %s, %s, %s)' ..
            ' RETURNING ' .. database.TIME_COLUMNS_EXPIRING,
            self.id, self.owner, self.url, self.expires_at or ngx.null
        )
        primary_push_action = 'create'
        self.not_in_db = nil
    else
        res = database.get_shared():query_single(
            'UPDATE links \
                SET owner = %s, url = %s, expires_at = %s \
                updated_at = (now() at time zone \'utc\') \
                WHERE id = %s \
                RETURNING ' .. database.TIME_COLUMNS_EXPIRING,
            self.owner, self.url, self.expires_at or ngx.null, self.id
        )
        primary_push_action = 'update'
    end
    self.created_at = res.created_at
    self.updated_at = res.updated_at
    self.expires_at = res.expires_at
    if self.expires_at == ngx.null then
        self.expires_at = nil
    end

    local owner = user_model.get_by_id(self.owner)
    owner:send_event(primary_push_action, 'link', self:get_private())
end

function link_mt:get_public()
    return {
        id = self.id,
        url = self.url,
        owner = self.owner,
        short_url = url_config.short .. "/" .. self.id,
        created_at = self.created_at,
        updated_at = self.updated_at,
        expires_at = self.expires_at,
    }
end
link_mt.get_private = link_mt.get_public

function link_model.get_public_fields()
    return {
        id = {
            type = "string",
            required = true,
        },
        url = {
            type = "string",
            required = true,
        },
        owner = {
            type = "uuid",
            required = true,
        },
        short_url = {
            type = "string",
            required = true,
        },
        created_at = {
            type = "timestamp",
            required = true,
        },
        updated_at = {
            type = "timestamp",
            required = true,
        },
        expires_at = {
            type = "timestamp",
            required = false,
        },
    }
end
link_model.get_private_fields = link_model.get_public_fields

link_mt.__index = link_mt

return link_model
