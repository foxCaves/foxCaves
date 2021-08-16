local database = require("foxcaves.database")
local events = require("foxcaves.events")
local random = require("foxcaves.random")
local url_config = require("foxcaves.config").urls

local setmetatable = setmetatable
local ngx = ngx
local next = next

local LinkMT = {}
local Link = {}

require("foxcaves.module_helper").setmodenv()

local function makelinkmt(link)
    link.not_in_db = nil
    setmetatable(link, LinkMT)
    link:ComputeVirtuals()
    return link
end

local link_select = 'id, "user", url, ' .. database.TIME_COLUMNS

function Link.GetByUser(user)
    if user.id then
        user = user.id
    end

    local links = database.get_shared():query_safe('SELECT ' .. link_select .. ' FROM links WHERE "user" = %s', user)
    for k,v in next, links do
        links[k] = makelinkmt(v)
    end
    return links
end

function Link.GetByID(id)
	if not id then
		return nil
	end

	local link = database.get_shared():query_safe_single('SELECT ' .. link_select .. ' FROM links WHERE id = %s', id)

	if not link then
		return nil
	end

	return makelinkmt(link)
end

function Link.New()
    local link = {
        not_in_db = true,
        id = random.string(10),
    }
    setmetatable(link, LinkMT)
    return link
end

function LinkMT:ComputeVirtuals()
    self.short_url = url_config.short .. "/g" .. self.id
end

function LinkMT:Delete()
    database.get_shared():query_safe('DELETE FROM links WHERE id = %s', self.id)

	events.push_raw({
        action = 'link:delete',
        link = self
    }, self.user)
end

function LinkMT:SetOwner(user)
    self.user = user.id or user
end

function LinkMT:SetURL(url)
    self.url = url
    self:ComputeVirtuals()
    return true
end

function LinkMT:Save()
    local res, primary_push_action
    if self.not_in_db then
        res = database.get_shared():query_safe_single(
            'INSERT INTO links (id, "user", url) VALUES (%s, %s, %s) RETURNING ' .. database.TIME_COLUMNS,
            self.id, self.user, self.url
        )
        primary_push_action = 'create'
        self.not_in_db = nil
    else
        res = database.get_shared():query_safe_single(
            'UPDATE links \
                SET "user" = %s, url = %s, \
                updated_at = (now() at time zone \'utc\') \
                WHERE id = %s \
                RETURNING ' .. database.TIME_COLUMNS,
            self.user, self.url, self.id
        )
        primary_push_action = 'refresh'
    end
    self.created_at = res.created_at
    self.updated_at = res.updated_at

	events.push_raw({
		action = "link:" .. primary_push_action,
		link = self,
	}, self.user)
end

LinkMT.__index = LinkMT

return Link
