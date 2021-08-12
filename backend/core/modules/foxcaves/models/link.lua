local database = require("foxcaves.database")
local events = require("foxcaves.events")
local random = require("foxcaves.random")
local url_config = require("foxcaves.config").urls

local setmetatable = setmetatable
local ngx = ngx
local next = next

local LinkMT = {}
local Link = {}

setfenv(1, Link)

local function makelinkmt(link)
    link.not_in_db = nil
    setmetatable(link, LinkMT)
    link:ComputeVirtuals()
    return link
end

function GetByUser(user)
    if user.id then
        user = user.id
    end

    local links = database.get_shared():query_safe('SELECT * FROM links WHERE "user" = %s', user)
    for k,v in next, links do
        links[k] = makelinkmt(v)
    end
    return links
end

function GetByID(id)
	if not id then 
		return nil
	end

	local link = database.get_shared():query_safe_single('SELECT * FROM links WHERE id = %s', id)

	if not link then
		return nil
	end

	return makelinkmt(link)
end

function New()
    local link = {
        not_in_db = true,
        id = random.string(10),
        time = ngx.time(),
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
    local primary_push_action
    if self.not_in_db then
        database.get_shared():query_safe('INSERT INTO links (id, "user", url, time) VALUES (%s, %s, %s, %s)', self.id, self.user, self.url, self.time)
        primary_push_action = 'create'
        self.not_in_db = nil
    else
        database.get_shared():query_safe('UPDATE links SET "user" = %s, url = %s, time = %s WHERE id = %s', self.user, self.url, self.time, self.id)
        primary_push_action = 'refresh'
    end
	events.push_raw({
		action = "link:" .. primary_push_action,
		link = self,
	}, self.user)
end

LinkMT.__index = LinkMT

return Link
