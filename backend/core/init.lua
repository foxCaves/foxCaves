lfs = require("lfs")
cjson = require("cjson")

function escape_html(str)
	if (not str) or type(str) ~= "string" then
		return str
	end
	str = str:gsub('["&<>]', {
		['"'] = "&quot;",
		["&"] = "&amp;",
		["<"] = "&lt;",
		[">"] = "&gt;",
	})
	return str
end

function explode(div,str) -- credit: http://richard.warburton.it
	local pos, arr = 0, {}
	-- for each divider found
	for st, sp in function() return str:find(div,pos,true) end do
		table_insert(arr,str:sub(pos,st-1)) -- Attach chars left of current divider
		pos = sp + 1 -- Jump past current divider
	end
	table_insert(arr, str:sub(pos)) -- Attach chars right of last divider
	return arr
end

local setfenv = setfenv
local getfenv = getfenv
local filecache = {}
function dofile(file)
	local cache_key
	if file:sub(1) == "/" then
		cache_key = file
	else
		cache_key = lfs.currentdir().."/"..file
	end
	local code = filecache[cache_key]
	if not code then
		local fh = io.open(file, "r")
		if not fh then
			error("Could not open file: " .. file)
		end
		code = fh:read("*all")
		fh:close()
		local err
		code, err = load("return function() "..code.."\nend", file)
		if err then error(err) end
		filecache[cache_key] = code
	end
	return setfenv(code(), getfenv())()
end

loadfile("/var/www/foxcaves/lua/core/mail.lua")()
loadfile("/var/www/foxcaves/lua/core/random.lua")()
loadfile("/var/www/foxcaves/lua/core/template.lua")()
loadfile("/var/www/foxcaves/lua/core/router.lua")()

collectgarbage("collect")
