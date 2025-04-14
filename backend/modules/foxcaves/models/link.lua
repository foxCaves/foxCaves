local database = require('foxcaves.database')
local random = require('foxcaves.random')
local cdn_url = require('foxcaves.config').http.cdn_url
local user_model = require('foxcaves.models.user')

local ngx = ngx
local setmetatable = setmetatable
local next = next

local link_mt = {}
local link_model = {}

require('foxcaves.module_helper').setmodenv()

local function makelinkmt(link)
    database.transfer_time_columns(link, link)
    link.not_in_db = nil
    setmetatable(link, link_mt)
    return link
end

local link_select = 'id, owner, target, ' .. database.TIME_COLUMNS_EXPIRING

function link_model.get_by_query(query, options, ...)
    return link_model.get_by_query_raw(
        '(expires_at IS NULL OR expires_at >= NOW()) AND (' .. query .. ')',
        options,
        ...
    )
end

function link_model.count_by_query(query, ...)
    local res = database.get_shared():query_single('SELECT COUNT(id) AS count FROM links WHERE ' .. query, nil, ...)
    if not res then
        return 0
    end
    return res.count
end

function link_model.get_by_query_raw(query, options, ...)
    options = options or {}
    if not options.order_by then
        options.order_by = {
            column = 'created_at',
            desc = true,
        }
    end

    local links = database.get_shared():query('SELECT ' .. link_select .. ' FROM links WHERE ' .. query, options, ...)
    for k, v in next, links do
        links[k] = makelinkmt(v)
    end
    return links
end

function link_model.get_by_owner(user, options)
    if not user then
        return {}
    end

    if user.id then
        user = user.id
    end

    local query_func = link_model.get_by_query
    if options and options.all then
        query_func = link_model.get_by_query_raw
    end
    return query_func('owner = %s', options, user)
end

function link_model.count_by_owner(user)
    if not user then
        return 0
    end

    if user.id then
        user = user.id
    end

    local res = database.get_shared():query_single('SELECT COUNT(id) FROM links WHERE owner = %s', nil, user)
    if not res then
        return 0
    end
    return res.count
end

function link_model.get_by_id(id)
    if not id then
        return nil
    end

    local links = link_model.get_by_query('id = %s', nil, id)
    if links and links[1] then
        return makelinkmt(links[1])
    end
    return nil
end

function link_model.new()
    local link = {
        not_in_db = true,
        id = 'g' .. random.string(10),
    }
    setmetatable(link, link_mt)
    return link
end

function link_mt:delete()
    database.get_shared():query('DELETE FROM links WHERE id = %s', nil, self.id)

    local owner = user_model.get_by_id(self.owner)
    owner:send_event('delete', 'link', self:get_private())
end

function link_mt:set_owner(user)
    self.owner = user.id or user
end

function link_mt:set_target(target)
    self.target = target
    return true
end

function link_mt:save()
    local res, primary_push_action
    if self.not_in_db then
        res =
            database.get_shared():query_single(
                'INSERT INTO links (id, owner, target, expires_at) VALUES (%s, %s, %s, %s)' .. ' RETURNING ' .. database.TIME_COLUMNS_EXPIRING,
                nil,
                self.id,
                self.owner,
                self.target,
                self.expires_at or ngx.null
            )
        primary_push_action = 'create'
        self.not_in_db = nil
    else
        res =
            database.get_shared():query_single(
                "UPDATE links \
                SET owner = %s, target = %s, \
                expires_at = %s, updated_at = (now() at time zone 'utc') \
                WHERE id = %s \
                RETURNING " .. database.TIME_COLUMNS_EXPIRING,
                nil,
                self.owner,
                self.target,
                self.expires_at or ngx.null,
                self.id
            )
        primary_push_action = 'update'
    end

    database.transfer_time_columns(self, res)

    local owner = user_model.get_by_id(self.owner)
    owner:send_event(primary_push_action, 'link', self:get_private())
end

function link_mt:get_public()
    return {
        id = self.id,
        target = self.target,
        owner = self.owner,
        url = cdn_url .. '/' .. self.id,
        created_at = self.created_at,
        updated_at = self.updated_at,
        expires_at = self.expires_at,
    }
end

link_mt.get_private = link_mt.get_public

function link_mt.can_view(_, _)
    return true
end

function link_mt:can_edit(user)
    if not user then
        return false
    end
    if user.id == self.owner then
        return true
    end
    if user:is_admin() then
        return true
    end
    return false
end

function link_model.get_public_fields()
    return {
        id = {
            type = 'string',
            required = true,
        },
        url = {
            type = 'string',
            required = true,
        },
        owner = {
            type = 'uuid',
            required = true,
        },
        target = {
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
        expires_at = {
            type = 'timestamp',
            required = false,
        },
    }
end

link_model.get_private_fields = link_model.get_public_fields

link_mt.__index = link_mt

return link_model
