dofile(ngx.var.main_root .. "/scripts/global.lua")
--if not ngx.ctx.user then return ngx.redirect("/login") end

local name = ngx.var.REQUEST_URI
local nameregex = ngx.re.match(name, "live/([a-zA-Z0-9]+)(\\?([a-zA-Z0-9]*))?$", "o")

if (not nameregex) or (not nameregex[1]) then
	return ngx.exec("/error/403")
end

local sid = nameregex[3]
nameregex = nameregex[1]

if (not sid) or sid == "" then
	return ngx.redirect("/live/" .. nameregex .. "?" .. randstr(10))
end

dofile("scripts/fileapi.lua")
local file = file_get(nameregex)
if not file  then
	return ngx.exec("/error/404")
end

if file.type ~= 1 then
	return ngx.exec("/error/400")
end

dofile("scripts/navtbl.lua")
ngx.print(load_template("live", {
	MAINTITLE = "Live drawing file - " .. file.name,
	ADDLINKS = build_nav(navtbl),
	FILE = file,
	FILEID = nameregex,
	LDSID = sid,
	MAX_BRUSH_WIDTH = 200
}))
ngx.eof()
