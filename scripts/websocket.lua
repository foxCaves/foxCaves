local next = next
local tonumber = tonumber
local tostring = tostring
local setmetatable = setmetatable
local print = print
local error = error
local pcall = pcall
local G = _G
local table_insert = table.insert
local table_concat = table.concat
local string_format = string.format
local time = os.time

local lfs = require("lfs")
lfs.chdir("..")
local websockets = require("websockets")
local redis = require("redis")
lfs = nil

dofile("config/database.lua")

module("liveedit_websocket")

local database
do
	local dbip = G.dbip
	local dbport = G.dbport
	local dbpass = G.dbpass
	local dbkeys = G.dbkeys

	database = { ping = function() return false end }
	
	local reconntries = 0
	function database_ping()
		local ret = database:ping()
		if not ret then
			if reconntries > 3 then
				reconntries = 0
				error("Sorry, database error")
			end
			reconntries = reconntries + 1
			database = redis.connect(dbip, dbport)
			database.KEYS = dbkeys
			database:auth(dbpass)
			print("Redis (re)connected successfully!")
			return database_ping()
		else
			reconntries = 0
			return ret
		end
	end
end
G = nil
database_ping()

local function explode(div,str) -- credit: http://richard.warburton.it
	local pos,arr = 0,{}
	-- for each divider found
	for st,sp in function() return str:find(div,pos,true) end do
		table_insert(arr,str:sub(pos,st-1)) -- Attach chars left of current divider
		pos = sp + 1 -- Jump past current divider
	end
	table_insert(arr,str:sub(pos)) -- Attach chars right of last divider
	return arr
end

local ws_data_global = {}
local history_global = {}
local last_wsid = {}

local EVENT_WIDTH = "w"
local EVENT_COLOR = "c"
local EVENT_BRUSH = "b"
local EVENT_MOUSE_UP = "u"
local EVENT_MOUSE_DOWN = "d"
local EVENT_MOUSE_MOVE = "m"
local EVENT_MOUSE_CURSOR = "p"

local EVENT_RESET = "r"

local EVENT_CUSTOM = "x"

local EVENT_JOIN = "j"
local EVENT_LEAVE = "l"
local EVENT_ERROR = "e"
local EVENT_IMGBURST = "i"

local cEVENT_JOIN = EVENT_JOIN:byte()
local cEVENT_MOUSE_CURSOR = EVENT_MOUSE_CURSOR:byte()

local valid_brushes = {
	brush = true,
	circle = true,
	rectangle = true,
	line = true,
	erase = true,
	text = true,
	restore = true
}

local chr_a,chr_f,chr_0,chr_9 = ("af09"):byte(1,4)

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
	[EVENT_MOUSE_CURSOR] = function(user, data)
		if #data ~= 2 then error("Invalid payload") end
		user.cursorX = tonumber(data[1])
		if (not user.cursorX) or (user.cursorX < 0) then error("Invalid X") end
		user.cursorY = tonumber(data[2])
		if (not user.cursorY) or (user.cursorY < 0) then error("Invalid Y") end
	end,
	[EVENT_CUSTOM] = function(user, data)
		if #data ~= 3 then error("Invalid payload") end
	end,
	[EVENT_RESET] = function(user, data)
		if #data > 1 or (data[1] and data[1] ~= "") then error("Invalid payload") end
	end,
	--[[[EVENT_IMGBURST] = function(user, data)
		local other = user.ws_data[tonumber(data[1])]
		other:send(EVENT_IMGBURST.."a|"..data[2].."|")
		return false
	end,]]
	[EVENT_LEAVE] = function(user, data)
		self:kick()
		return ""
	end,
	[EVENT_JOIN] = function(user, data)
		if #data ~= 3 then
			error("Invalid payload")
		end
		
		if data[1] == "" or data[2] == "" or data[3] == "" then
			error("Missing payload data")
		end
	
		database_ping() --Ensure database exists
		
		local tempvar = data[1]
		if tempvar ~= "GUEST" then
			--Session => User
			local result = database:get(database.KEYS.SESSIONS..tempvar)
			if not result then
				error("Invalid session")
			end
			result = database:hget(database.KEYS.USERS..result, "username")
			if not result then
				error("Invalid user")
			end
			user.name = result
			--End session => User
		end
	
		tempvar = data[2]
		user.globkey = string_format("%s_%s", tempvar, data[3])
		
		user.ws_data = ws_data_global[user.globkey]
		if not user.ws_data then
			--Sanity check for the FileID
			local result = database:hget(database.KEYS.FILES..tempvar, "type")
			if (not result) or tonumber(result) ~= 1  then
				error("Invalid FileID")
			end
			--End sanity check
		
			user.ws_data = {}
			user.history = {"r0|"}
			history_global[user.globkey] = user.history
			ws_data_global[user.globkey] = user.ws_data
		else
			user.history = history_global[user.globkey]
		end
		
		local wsid = last_wsid[user.globkey] or 1
		while user.ws_data[wsid] do
			wsid = wsid + 1
		end
		last_wsid[user.globkey] = wsid + 1
		
		if not user.name then
			user.name = string_format("Guest %i", wsid)
		end
		
		user.image = data[2]
		user.drawingsession = data[3]
		user.id = wsid
		user.isjoined = true
		
		user.ws_data[wsid] = user
		
		--local imgburst_found = false
		for uid,udata in next, user.ws_data do
			if uid ~= wsid then
				if udata.name == user.name then
					udata:send(EVENT_ERROR.."Logged in from another location")
					udata:kick()
				else
					user:send(string_format("%s%i|%s|%i|%s|%s|%i|%i",EVENT_JOIN,
						udata.id,udata.name,(udata.width or 0),(udata.color or "000"),(udata.brush or "brush"),(udata.cursorX or 0),(udata.cursorY or 0)
					))
					--[[if uid ~= user.id and not imgburst_found then
						imgburst_found = true
						user:send(EVENT_IMGBURST.."r|"..user.id.."|")
					end]]
				end				
			end
		end
		
		user.historyburst = true
		print("Join: ", user.name, user.id, user.image, user.drawingsession)		
		
		return string_format("%s|%i|%s|%s|%i|%i",
			user.name,(user.width or 0),(user.color or "000"),(user.brush or "brush"),(user.cursorX or 0),(user.cursorY or 0)
		)
	end
}
event_handlers[EVENT_MOUSE_UP] = event_handlers[EVENT_MOUSE_CURSOR]
event_handlers[EVENT_MOUSE_DOWN] = event_handlers[EVENT_MOUSE_CURSOR]
event_handlers[EVENT_MOUSE_MOVE] = event_handlers[EVENT_MOUSE_CURSOR]
do
	local evthdl = event_handlers
	event_handlers = {}
	for k,v in next, evthdl do
		event_handlers[k:byte()] = v
	end
end


USERMETA = {}
USERMETA.__index = USERMETA
function USERMETA:send(data)
	if self.socket then
		self.socket:write(data.."\n", websockets.WRITE_TEXT)
	end
end
function USERMETA:kick()
	if self.id then
		self.ws_data[self.id] = nil
	end
	
	if self.isjoined then
		print("Leave: ", self.name, self.id, self.image, self.drawingsession)		
		self.isjoined = false
		
		if(next(self.ws_data) == nil) then
			ws_data_global[self.globkey] = nil
			history_global[self.globkey] = nil
			last_wsid[self.globkey] = nil
			
			print("Unsetting globkey: ", self.globkey)
		else
			last_wsid[self.globkey] = self.id
		end
	else
		self.id = nil
		return
	end
	
	if self.socket then
		self.socket:close(0)
		self.socket = nil
	end
	
	self.id = nil
end
function USERMETA:broadcast_others(data, nohistory)
	if not nohistory then
		table_insert(self.history, data)
	end
	for _,other in next, self.ws_data do
		if other.id ~= self.id then
			other:send(data)
		end
	end
end

function USERMETA:event_received(ws, rawdata)
	self.socket = ws

	local evid = rawdata:byte(1)
	local data = {}
	if rawdata:len() > 1 then
		rawdata = rawdata:sub(2)
		data = explode("|", rawdata)
	else
		rawdata = ""
	end
	
	if (evid == cEVENT_JOIN) == self.isjoined then
		error("Invalid state for this packet: "..evid.."|"..tostring(self.isjoined))
	else
		local evthandl = event_handlers[evid]
		if evthandl then
			local ret = evthandl(self, data)
			if ret == false then
				return
			elseif ret then
				rawdata = ret
			end
		else
			error("Invalid packet: "..evid)
		end
	end
	if not self.id then return end
	self:broadcast_others(string_format("%c%i|%s", evid, self.id, rawdata), (evid == cEVENT_MOUSE_CURSOR))
	
	if historyburst then
		self:send(table_concat(self.history ,"\n"))
		self:send(string_format("%s%i|", EVENT_LEAVE, self.id))
		historyburst = false
	end
end

function USERMETA:socket_onrecv(ws, data)
	data = self.databuff..data
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
	local data = explode("\n", data)
	for _,v in next, data do
		if v and v ~= "" then
			local isok, err = pcall(self.event_received, self, ws, v)
			if not isok then
				print("EVTErr: ", err)
				self:send(EVENT_ERROR..err)
				self:kick()
			end
		end
	end
end

local function paint_cb(ws)
	local user = setmetatable({
		historyburst = false,
		isjoined = false,
		databuff = ""
	}, USERMETA)
	
	ws:on_receive(function(ws, data)
		user:socket_onrecv(ws, data)
	end)
	
	ws:on_closed(function()
		user:kick()
	end)
	
	ws:on_broadcast(websockets.WRITE_TEXT)
end

local context = websockets.context({
	port = 8002,
	on_http = function() end,
	protocols = {
		paint = paint_cb
	},
	ssl_cert_filepath = "/etc/apache2/ssl/foxcav_es.crt",
	ssl_private_key_filepath = "/etc/apache2/ssl/foxcav_es.key",
	gid = 33,
	uid = 33
})

while true do
	context:service(100000)
end