local lfs = require("lfs")
lfs.chdir("/var/www/doripush/")
local websockets = require("websockets")

local luasql = require("luasql.mysql")
local dbenv = luasql.mysql()
dofile("scripts/dbconfig.lua")
local database = dbenv:connect(dbconfig.database, dbconfig.user, dbconfig.password)
dbconfig = nil

function explode(div,str) -- credit: http://richard.warburton.it
	if (div=='') then return false end
	local pos,arr = 0,{}
	-- for each divider found
	for st,sp in function() return string.find(str,div,pos,true) end do
		table.insert(arr,string.sub(str,pos,st-1)) -- Attach chars left of current divider
		pos = sp + 1 -- Jump past current divider
	end
	table.insert(arr,string.sub(str,pos)) -- Attach chars right of last divider
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

local EVENT_JOIN = "j"
local EVENT_LEAVE = "l"
local EVENT_ERROR = "e"

local valid_brushes = {
	brush = true,
	circle = true,
	rectangle = true,
	line = true
}

local cA,cF,c0,c9 = string.byte("af09",1,4)

local event_handlers = {
	[EVENT_BRUSH] = function(user, data)
		if #data ~= 1 then error("Invalid payload") end
		data = data[1]
		if not valid_brushes[data] then error("Invalid brush") end
		user.brush = data
	end,
	[EVENT_COLOR] = function(user, data)
		if #data ~= 1 then error("Invalid payload") end
		data = data[1]:lower()
		local dlen = data:len()
		if dlen ~= 3 and dlen ~= 6 then
			error("Invalid color")
		else
			local dbyte
			for i=1,dlen do
				dbyte = string.byte(data, i)
				if (dbyte < cA or dbyte > cF) and (dbyte < c0 or dbyte > c9) then
					error("Invalid color")
				end
			end
		end
		user.color = data
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
	[EVENT_RESET] = function(user, data)
		if #data > 1 or (data[1] and data[1] ~= "") then error("Invalid payload") end
	end
}
event_handlers[EVENT_MOUSE_UP] = event_handlers[EVENT_MOUSE_CURSOR]
event_handlers[EVENT_MOUSE_DOWN] = event_handlers[EVENT_MOUSE_CURSOR]
event_handlers[EVENT_MOUSE_MOVE] = event_handlers[EVENT_MOUSE_CURSOR]

local function paint_cb(ws)
	local ws_data
	local history
	local user = {}
	local globkey = nil
	local historyburst = false
	
	local function local_broadcast(data, dont_exclude_user)
		table.insert(history, data)
		for _,other in next, ws_data do
			if other.id ~= user.id or dont_exclude_user then
				other.socket:write(data.."\n", websockets.WRITE_TEXT)
			end
		end
	end

	local function evt_received(ws, rawdata)		
		local evid = rawdata:sub(1, 1)
		local data = {}
		if rawdata:len() > 1 then
			rawdata = rawdata:sub(2)
			data = explode("|", rawdata)
		else
			rawdata = ""
		end
		
		if evid == EVENT_JOIN then
			if user.isjoined then
				error("Invalid state for this packet")
			end
			
			if #data ~= 3 then
				error("Invalid payload")
			end
			
			if data[1] == "" or data[2] == "" or data[3] == "" then
				error("Missing payload data")
			end
		
			local sessionid = data[1]
			local result
			if sessionid ~= "GUEST" then
				--Session => User
				local cursor = database:execute("SELECT u.username AS name FROM users AS u, sessions AS s WHERE s.id = '"..database:escape(sessionid).."' AND u.id = s.user AND u.active = 1 LIMIT 0,1")
				result = {}
				cursor:fetch(result, "a")
				cursor:close()
				if not (result and result.name) then
					error("Invalid user")
				end
				result = result.name
				--End session => User
			else
				result = nil
			end
		
			globkey = data[2].."_"..data[3]
			ws_data = ws_data_global[globkey]
			
			if not ws_data then
				--Sanity check for the FileID
				local result = {}
				local cursor = database:execute("SELECT f.type, u.username, u.pro_expiry FROM files AS f, users AS u WHERE f.fileid = '"..database:escape(data[2]).."' AND f.user = u.id LIMIT 0,1")
				cursor:fetch(result, "a")
				cursor:close()
				if (not result) or tonumber(result.type) ~= 1 or tonumber(result.pro_expiry) < os.time()  then
					error("Invalid FileID")
				end
				--End sanity check
			
				ws_data = {}
				history = {"r0|"}
				history_global[globkey] = history
				ws_data_global[globkey] = ws_data
			else
				history = history_global[globkey]
			end
			local wsid = last_wsid[globkey] or 1
			while ws_data[wsid] do
				wsid = wsid + 1
			end
			last_wsid[globkey] = wsid + 1
			
			user.fileid = data[2]
			user.drawingid = data[3]
			user.socket = ws
			user.name = (result or ("Guest "..wsid))
			user.image = data[2]
			user.drawingsession = data[3]
			user.id = wsid
			user.isjoined = true
			
			for uid,udata in next, ws_data do
				ws:write("j"..udata.id.."|"..udata.name.."|"..(udata.width or 0).."|"..(udata.color or "000").."|"..(udata.brush or "brush").."|"..(udata.cursorX or 0).."|"..(udata.cursorY or 0).."\n", websockets.WRITE_TEXT)
			end
			
			ws_data[wsid] = user
			
			rawdata = user.name.."|"..(user.width or 0).."|"..(user.color or "000").."|"..(user.brush or "brush").."|"..(user.cursorX or 0).."|"..(user.cursorY or 0)
			historyburst = true
			
			print("Join: ", user.name.." with ID "..user.id.." in image "..user.image.." and drawing session "..user.drawingsession)
		elseif evid == EVENT_LEAVE then
			if user.id then
				ws_data[user.id] = nil
			end
			
			if user.isjoined then
				print("Leave: ", user.name.." with ID "..user.id.." in image "..user.image.." and drawing session "..user.drawingsession)
				user.isjoined = false
				
				if(next(ws_data) == nil) then
					ws_data_global[globkey] = nil
					history_global[globkey] = nil
					last_wsid[globkey] = nil
					print("Unsetting globkey: ", globkey)
				else
					last_wsid[globkey] = user.id
				end
			else
				return
			end
			
			ws = ws or user.socket
			if ws then
				ws:close(0)
			end
			
			rawdata = ""
		elseif not user.isjoined then
			error("Invalid state for this packet")
		else
			local evthandl = event_handlers[evid]
			if evthandl then
				local ret = event_handlers[evid](user, data)
				if ret == false then
					return
				elseif ret then
					rawdata = ret
				end
			else
				error("Invalid packet")
			end
		end
		if not user.id then return end
		local_broadcast(evid..user.id.."|"..rawdata)
		
		if historyburst then
			ws:write(table.concat(history ,"\n"), websockets.WRITE_TEXT)
		end
	end
	
	ws:on_receive(function(ws, data)
		local data = explode("\n", data)
		for _,v in next, data do
			if v and v ~= "" then
				local isok, err = pcall(evt_received, ws, v)
				if not isok then
					print("EVTErr: ", err)
					ws:write("e"..err.."\n", websockets.WRITE_TEXT)
					return evt_received(ws, EVENT_LEAVE)
				end
			end
		end
	end)
	
	ws:on_closed(function()
		evt_received(ws, EVENT_LEAVE)
	end)
	
	ws:on_broadcast(websockets.WRITE_TEXT)
end

local context = websockets.context({
	port = 8002,
	on_http = function() end,
	protocols = {
		['paint'] = paint_cb
	},
	ssl_cert_filepath = "/etc/apache2/ssl/foxcav_es.crt",
	ssl_private_key_filepath = "/etc/apache2/ssl/foxcav_es.key",
	gid = 33,
	uid = 33
})

while true do
	context:service(100000)
end