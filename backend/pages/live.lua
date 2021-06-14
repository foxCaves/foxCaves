dofile(ngx.var.main_root .. "/scripts/global.lua")
--if not ngx.ctx.user then return ngx.redirect("/login") end

local fileid = ngx.ctx.route_vars.id
local sid = ngx.var.arg_sid

if (not fileid) or fileid == "" then
	return ngx.exec("/error/400")
end

dofile("scripts/fileapi.lua")
local file = file_get(fileid)
if not file  then
	return ngx.exec("/error/404")
end

if (not sid) or sid == "" then
	return ngx.redirect("/live/" .. fileid .. "?sid=" .. ngx.escape_uri(randstr(10)))
end

if file.type ~= 1 then
	return ngx.exec("/error/400")
end

printTemplateAndClose("live", {
	MAINTITLE = "Live drawing file - " .. file.name,
	FILE = file,
	FILEID = fileid,
	LDSID = sid,
	MAX_BRUSH_WIDTH = 200
})
