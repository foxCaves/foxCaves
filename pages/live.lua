dofile(ngx.var.main_root.."/scripts/global.lua")
--if not ngx.ctx.user then return ngx.redirect("/login") end

local name = ngx.var.REQUEST_URI
local nameregex = ngx.re.match(name, "live/([a-zA-Z0-9]+)(\\?([a-zA-Z0-9]*))?$", "o")

if (not nameregex) or (not nameregex[1]) then
	ngx.status = 403
	ngx.print("Invalid filename")
	return ngx.eof()
end

local sid = nameregex[3]
nameregex = nameregex[1]

if (not sid) or sid == "" then
	return ngx.redirect("/live/"..nameregex.."?"..randstr(10))
end

dofile("scripts/fileapi.lua")
local file = file_get(nameregex)
if not file  then
	ngx.status = 404
	ngx.print("File not found")
	return ngx.eof()
end

if file.type ~= 1 then
	ngx.status = 400
	ngx.print("Not an image")
	return ngx.eof()
end

dofile("scripts/navtbl.lua")
ngx.print(load_template("live", {
	MAINTITLE = "Live drawing file - " .. file.name,
	ADDLINKS = build_nav(navtbl),
	FILE = file,
	FILEID = nameregex,
	LDSID = sid
}))
ngx.eof()
