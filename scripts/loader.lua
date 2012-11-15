local function debug_trace(err)
	local ret = {err}
	local lev = 2
	local cur = nil
	while true do
		cur = debug.getinfo(lev)
		if not cur then break end
		local name = cur.name
		if not name then
			name = "In main chunk"
		else
			name = "In function '"..name.."'"
		end
		table.insert(ret, "\t"..cur.short_src..":"..cur.currentline..": "..name)
		lev = lev + 1
	end
	return table.concat(ret, "\n")
end

local isok, err = xpcall(dofile, debug_trace, ngx.var.run_lua_file)

if not isok then
	if IS_DEVELOPMENT then
		ngx.header.content_type = "text/plain"
		ngx.print(err)
		return ngx.eof()
	else
		return ngx.exec("/error/500")
	end
end