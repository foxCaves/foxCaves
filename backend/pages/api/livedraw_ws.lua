ALLOW_GUEST = true
dofile(ngx.var.main_root .. "/scripts/global.lua")
dofile("scripts/api_login.lua")

local next = next
local tonumber = tonumber
local tostring = tostring
local setmetatable = setmetatable
local pcall = pcall
local table_insert = table.insert
local table_concat = table.concat
local string_format = string.format
local time = os.time
local ngx = ngx
local randstr = randstr
local database = ngx.ctx.database

local server = require("resty.websocket.server")
local ws, err = server:new({
    timeout = 5000,
    max_payload_len = 65535,
})
if not ws then
    ngx.exit(400)
    return
end

module("liveedit_websocket")

local function explode(div,str) -- credit: http://richard.warburton.it
	local pos, arr = 0, {}
	-- for each divider found
	for st, sp in function() return str:find(div,pos,true) end do
		table_insert(arr,str:sub(pos,st-1)) -- Attach chars left of current divider
		pos = sp + 1 -- Jump past current divider
	end
	table_insert(arr, str:sub(pos)) -- Attach chars right of last divider
	return arr
end

local EVENT_WIDTH = "w"
local EVENT_COLOR = "c"
local EVENT_BRUSH = "b"
local EVENT_MOUSE_UP = "u"
local EVENT_MOUSE_DOWN = "d"
local EVENT_MOUSE_MOVE = "m"
local EVENT_MOUSE_CURSOR = "p"

local EVENT_RESET = "r"

local EVENT_CUSTOM = "x"

local EVENT_LEAVE = "l"
local EVENT_ERROR = "e"
local EVENT_IMGBURST = "i"

local EVENT_MOUSE_DOUBLE_CLICK = "F"

local cEVENT_MOUSE_CURSOR = EVENT_MOUSE_CURSOR:byte()

local should_run = true

local function close()
	ws:send_close()
	ngx.eof()
end

local function error(str)
	ws:send_text(EVENT_ERROR .. str)
	close()
end

local function internal_error(str)
	error("Internal error")
	ngx.log(ngx.WARN, "Livedraw lua error: " .. str)
end

local valid_brushes = {
	brush = true,
	circle = true,
	rectangle = true,
	line = true,
	erase = true,
	text = true,
	restore = true,
	polygon = true
}

local chr_a, chr_f, chr_0, chr_9 = ("af09"):byte(1, 4)

local event_handlers = {
	[EVENT_BRUSH] = function(user, data)
		if #data ~= 1 then error("Invalid payload") end
		data = data[1]
		if not valid_brushes[data] then error("Invalid brush") end
		user.brush = data
		user:update()
	end,
	[EVENT_COLOR] = function(user, data)
		if #data ~= 1 then error("Invalid payload") end
		user.color = data[1]:lower()
		user:update()
	end,
	[EVENT_WIDTH] = function(user, data)
		if #data ~= 1 then error("Invalid payload") end
		data = tonumber(data[1])
		if (not data) or data <= 0 then error("Invalid width") end
		user.width = data
		user:update()
	end,
	[EVENT_MOUSE_MOVE] = function(user, data)
		if #data ~= 2 then error("Invalid payload") end
		local x = tonumber(data[1])
		local y = tonumber(data[2])
		if not x or x < 0 then error("Invalid X") end
		if not y or y < 0 then error("Invalid Y") end
	end,
	[EVENT_MOUSE_CURSOR] = function(user, data)
		return false
	end,
	[EVENT_CUSTOM] = function(user, data)
		if #data ~= 3 then error("Invalid payload") end
	end,
	[EVENT_RESET] = function(user, data)
		if #data > 1 or (data[1] and data[1] ~= "") then
			error("Invalid payload")
		end
	end,
	[EVENT_LEAVE] = function(user, data)
		user:kick()
		return ""
	end,
}
event_handlers[EVENT_MOUSE_UP] = event_handlers[EVENT_MOUSE_MOVE]
event_handlers[EVENT_MOUSE_DOWN] = event_handlers[EVENT_MOUSE_MOVE]
event_handlers[EVENT_MOUSE_DOUBLE_CLICK] = event_handlers[EVENT_MOUSE_MOVE]
event_handlers[EVENT_MOUSE_CURSOR] = event_handlers[EVENT_MOUSE_MOVE]
do
	local evthdl = event_handlers
	event_handlers = {}
	for k, v in next, evthdl do
		event_handlers[k:byte()] = v
	end
end


USERMETA = {}
USERMETA.__index = USERMETA
function USERMETA:send(data)
	ws:send_text(data .. "\n")
end
function USERMETA:serialize()
	return string_format(
		"%s|%s|%i|%s|%s",
		self.id,
		self.name,
		self.width or 0,
		self.color or "000",
		self.brush or "brush"
	)
end
function USERMETA:refresh()
	if not self.channel then
		return
	end
	database:expire(database.KEYS.LIVEDRAW .. self.channel, 3600)
end
function USERMETA:update()
	database:hset(database.KEYS.LIVEDRAW .. self.channel, self.id, self:serialize())
	self:refresh()
end
function USERMETA:kick()
	close()
	if not self.id then
		return
	end
	database:hrem(database.KEYS.LIVEDRAW .. self.channel, self.id)
	self.id = nil
end

function USERMETA:event_received(rawdata)
	local evid = rawdata:byte(1)
	local data = {}
	if rawdata:len() > 1 then
		rawdata = rawdata:sub(2)
		data = explode("|", rawdata)
	else
		rawdata = ""
	end

	local evthandl = event_handlers[evid]
	if evthandl then
		local ret = evthandl(self, data)
		if ret == false then
			return
		elseif ret then
			rawdata = ret
		end
	else
		error("Invalid packet: " .. evid)
	end
	if not self.id or not self.channel then return end
	if evid ~= cEVENT_MOUSE_CURSOR then
		--TODO: table_insert(self.history, data)
	end
	database:publish(database.KEYS.LIVEDRAW .. self.channel, string_format("%c%s|%s", evid, self.id, rawdata))

	--[[ TODO:
	if self.historyburst then
		self:send_text(table_concat(self.history ,"\n"))
		self:send_text(string_format("%s%i|", EVENT_LEAVE, self.id))
		self.historyburst = false
	end
	]]
end

function USERMETA:socket_onrecv(data)
	data = self.databuff .. data
	local datalen = data:len()
	if data:sub(datalen, datalen) ~= "\n" then
		datalen = nil
		local newlen = 1
		while newlen do
			newlen = data:find("\n", newlen, true)
			if newlen then datalen = newlen end
		end

		if datalen then
			self.databuff = data:sub(1, datalen)
			data = data:sub(datalen + 1)
		else
			self.databuff = data
			return
		end
	end
	data = explode("\n", data)
	for _,v in next, data do
		if v and v ~= "" then
			local isok, err = pcall(self.event_received, self, v)
			if not isok then
				internal_error(err)
			end
		end
	end
end

local user = setmetatable({
	historyburst = false,
	databuff = ""
}, USERMETA)

local function websocket_read()
	while should_run do
        local data, typ, err = ws:recv_frame()
        if ws.fatal or typ == "close" or typ == "error" then
            ws:send_close()
            ngx.eof()
            break
        end
        if typ == "ping" then
            ws:send_pong(data)
			user:refresh()
        end
		if typ == "text" then
			user:socket_onrecv(data)
		end
	end

	should_run = false
end

local sub_database = ngx.ctx.make_database()
function get_id_from_packet(str)
    str = str:sub(2, str:find("|") - 1)
    return str
end
local function redis_read()
	while should_run do
        local res, err = sub_database:read_reply()
        if err and err ~= "timeout" then
            ws:send_close()
            ngx.eof()
            break
        end
        if res then
			res = res[3]
			local id = get_id_from_packet(res)
			if id ~= user.id then
            	ws:send_text(res)
			end
        end
	end
	should_run = false
end

user.image = ngx.var.arg_id
user.drawingsession = ngx.var.arg_session
user.channel = string_format("%s_%s", user.image, user.drawingsession)
user.name = ngx.ctx.user.name
local wsid = randstr(16)
if not user.name then
	user.name = string_format("Guest %s", wsid)
end
user.id = wsid

sub_database:subscribe(database.KEYS.LIVEDRAW .. user.channel)

user.historyburst = true
user:update()
local others = database:hgetall(database.KEYS.LIVEDRAW .. user.channel)
for _, other in next, others do
	ws:send_text(string_format("%s%s", EVENT_JOIN, other))
end

local sub_database_thread = ngx.thread.spawn(redis_read)
websocket_read()
ngx.eof()
ngx.thread.wait(sub_database_thread)
sub_database:close()
