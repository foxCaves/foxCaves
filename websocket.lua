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
local last_wsid = {}

local EVENT_WIDTH = "w"
local EVENT_COLOR = "c"
local EVENT_BRUSH = "b"
local EVENT_MOUSE_UP = "u"
local EVENT_MOUSE_DOWN = "d"
local EVENT_MOUSE_MOVE = "m"
local EVENT_MOUSE_CURSOR = "s"

local EVENT_RESET = "r"

local EVENT_JOIN = "j"
local EVENT_LEAVE = "l"

local event_handlers = {
	[EVENT_BRUSH] = function(user, data)
		user.brush = data[1]
	end,
	[EVENT_COLOR] = function(user, data)
		user.color = data[1]
	end,
	[EVENT_WIDTH] = function(user, data)
		user.width = data[1]
	end
}

local function paint_cb(ws)
	local ws_data
	local user = {}
	local wsid = nil
	local globkey = nil
	
	local function local_broadcast(data, dont_exclude_user)
		for _,other in pairs(ws_data) do
			if other.id ~= wsid or dont_exclude_user then
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
			local sessionid = data[1]
			local result
			if sessionid ~= "GUEST" then
				local cursor = database:execute("SELECT u.username AS name FROM users AS u, sessions AS s WHERE s.id = '"..database:escape(sessionid).."' AND u.id = s.user AND u.active = 1")
				result = {}
				cursor:fetch(result, "a")
				cursor:close()
				if not (result and result.name) then
					return evt_received(ws, EVENT_LEAVE)
				end
				result = result.name
			else
				result = nil
			end
		
			globkey = data[2].."_"..data[3]
			ws_data = ws_data_global[globkey]
			if not ws_data then
				ws_data = {}
				ws_data_global[globkey] = ws_data
			end
			local wsid = last_wsid[globkey] or 1
			while ws_data[wsid] do
				wsid = wsid + 1
			end
			last_wsid[globkey] = wsid + 1
			
			user.fileid = data[2]
			user.drawingid = data[3]
			user.socket = ws
			user.name = (result or ("Guest"..wsid))
			user.image = data[2]
			user.drawingsession = data[3]
			user.id = wsid
			
			for uid,udata in pairs(ws_data) do
				ws:write("j"..udata.id.."|"..udata.name.."|"..(udata.width or 0).."|"..(udata.color or "#000").."|"..(udata.brush or "brush").."\n", websockets.WRITE_TEXT)
			end
			
			ws_data[wsid] = user
			
			rawdata = user.name.."|"..(user.width or 0).."|"..(user.color or "#000").."|"..(user.brush or "brush")
			
			print("Join: "..user.name.." with ID "..user.id.." in image "..user.image.." and drawing session "..user.drawingsession)
		elseif evid == EVENT_LEAVE then
			if user.id then
				ws_data[user.id] = nil
				last_wsid[globkey] = user.id
			end
			if ws then
				ws:close("bye")
			end
			
			print("Leave: "..user.name.." with ID "..user.id.." in image "..user.image.." and drawing session "..user.drawingsession)
		end
		if event_handlers[evid] then
			local ret = event_handlers[evid](user, data)
			if ret == false then
				return
			elseif ret then
				rawdata = ret
			end
		end
		if not user.id then return end
		local_broadcast(evid..user.id.."|"..rawdata)
	end
	
	ws:on_receive(function(ws, data)
		local data = explode("\n", data)
		for _,v in next, data do
			if v and v ~= "" then
				evt_received(ws, v)
			end
		end
	end)
	
	ws:on_closed(function()
		evt_received(nil, EVENT_LEAVE)
	end)
	
	ws:on_broadcast(websockets.WRITE_TEXT)
end

local function paint_cb_pcall(...)
	local isok, err = pcall(paint_cb, ...)
	if not isok then
		print(err)
	end
end

local context = websockets.context({
	port = 8002,
	on_http = function() end,
	protocols = {
		['paint'] = paint_cb_pcall
	},
	ssl_cert_filepath = "/etc/apache2/ssl/foxcav_es.crt",
	ssl_private_key_filepath = "/etc/apache2/ssl/foxcav_es.key",
	gid = 33,
	uid = 33
})

while true do
	context:service(100000)
end