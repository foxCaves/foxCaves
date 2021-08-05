-- ROUTE:GET:/api/v1/ws/livedraw
api_ctx_init(true)

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
local unpack = unpack
local explode = explode

local redis = ngx.ctx.redis
local make_redis = make_redis

local server = require("resty.websocket.server")
local ws, err = server:new({
    timeout = 5000,
    max_payload_len = 65535,
})
if not ws then
    ngx.status = 400
    return
end

module("liveedit_websocket")

local EVENT_WIDTH = "w"
local EVENT_COLOR = "c"
local EVENT_BRUSH = "b"

local EVENT_MOUSE_UP = "u"
local EVENT_MOUSE_DOWN = "d"
local EVENT_MOUSE_MOVE = "m"
local EVENT_MOUSE_CURSOR = "p"
local EVENT_MOUSE_DOUBLE_CLICK = "F"

local EVENT_RESET = "r"

local EVENT_CUSTOM = "x"

local EVENT_JOIN = "j"
local EVENT_JOINDIRECT = "J"
local EVENT_LEAVE = "l"
local EVENT_ERROR = "e"
local EVENT_IMGBURST = "i"

local cEVENT_JOIN = EVENT_JOIN:byte()
local cEVENT_JOINDIRECT = EVENT_JOINDIRECT:byte()
local cEVENT_LEAVE = EVENT_LEAVE:byte()
local cEVENT_MOUSE_CURSOR = EVENT_MOUSE_CURSOR:byte()

local should_run = true

local function close()
	ws:send_close()
end

local function error(str)
	ws:send_text(EVENT_ERROR .. str)
	close()
end

local function internal_error(str)
	error("Internal error")
	ngx.log(ngx.ERR, "Livedraw lua error: " .. str)
end

local function pcall_internal(...)
	local tbl = {pcall(...)}
	if not tbl[1] then
		internal_error(tbl[2])
		return
	end
	return unpack(tbl)
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
	end,
	[EVENT_COLOR] = function(user, data)
		if #data ~= 1 then error("Invalid payload") end
		user.color = data[1]:lower()
	end,
	[EVENT_WIDTH] = function(user, data)
		if #data ~= 1 then error("Invalid payload") end
		data = tonumber(data[1])
		if (not data) or data <= 0 then error("Invalid width") end
		user.width = data
	end,
	[EVENT_MOUSE_MOVE] = function(user, data)
		if #data ~= 2 then error("Invalid payload") end
		local x = tonumber(data[1])
		local y = tonumber(data[2])
		if not x or x < 0 then error("Invalid X") end
		if not y or y < 0 then error("Invalid Y") end
		user.cursorX = x
		user.cursorY = y
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
		return false
	end,
	[EVENT_JOIN] = function(user, data)
		return false
	end,
	[EVENT_JOINDIRECT] = function(user, data)
		return false
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
	ws:send_text(data)
end
function USERMETA:serialize()
	return string_format(
		"%s|%i|%s|%s|%i|%i",
		self.name,
		self.width or 0,
		self.color or "000",
		self.brush or "brush",
		self.cursorX or 0,
		self.cursorY or 0
	)
end
function USERMETA:send_data()
	self:publish(cEVENT_JOIN, self:serialize())
end
function USERMETA:kick()
	close()
	if not self.id then
		return
	end
	self.id = nil
end
function USERMETA:publish(evid, data)
	redis:publish("livedraw:" .. self.channel, string_format("%c%s|%s", evid, self.id, data or ""))
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
	self:publish(evid, rawdata)
end

function USERMETA:socket_onrecv(data)
	pcall_internal(self.event_received, self, data)
end

local user = setmetatable({}, USERMETA)

local function websocket_read()
	while should_run do
		local data, typ, err = ws:recv_frame()
		if ws.fatal or typ == "close" or typ == "error" then
			ws:send_close()
			break
		end
		if err then
			ws:send_ping()
		elseif typ == "ping" then
			ws:send_pong(data)
		elseif typ == "text" then
			user:socket_onrecv(data)
		end
	end

	should_run = false
end

local sub_redis = make_redis()
function get_id_from_packet(str)
    str = str:sub(2, str:find("|") - 1)
    return str
end
local function redis_read()
	while should_run do
		local res, err = sub_redis:read_reply()
		if err and err ~= "timeout" then
			ws:send_close()
			break
		end
		if res then
			local data = res[3]
			local id = get_id_from_packet(data)
			if id ~= user.id then
				local evid = data:byte(1)
				if evid == cEVENT_JOINDIRECT then
					user:send_data()
				else
					ws:send_text(data)
				end
			end
		end
	end

	should_run = false
end

user.image = ngx.var.arg_id
user.drawingsession = ngx.var.arg_session
user.channel = string_format("%s:%s", user.image, user.drawingsession)
if ngx.ctx.user then
	user.name = ngx.ctx.user.username
end

local wsid = randstr(16)
if not user.name then
	user.name = string_format("Guest %s", wsid)
end
user.id = wsid

sub_redis:subscribe("livedraw:" .. user.channel)

user:send_data()
user:publish(cEVENT_JOINDIRECT)

local sub_redis_thread = ngx.thread.spawn(redis_read)
websocket_read()
user:publish(cEVENT_LEAVE)
ngx.thread.wait(sub_redis_thread)
