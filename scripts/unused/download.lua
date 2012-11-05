dofile("/var/www/foxcaves/scripts/global.lua")

local name = ngx.var.REQUEST_URI
local nameregex = ngx.re.match(name, "download/([a-zA-Z0-9]*)\\.", "o")

if (not nameregex) or (not nameregex[1]) then
	ngx.header["Content-Type"] = "text/html"
	ngx.status = 403
	ngx.print("Invalid filename")
	return ngx.eof()
end

nameregex = nameregex[1]

local database = ngx.ctx.database
local file = database:query("SELECT name, extension FROM files WHERE fileid = '"..nameregex.."' LIMIT 0,1")
if (not file) or (not file[1])  then
	ngx.header["Content-Type"] = "text/html"
	ngx.status = 404
	ngx.print("File not found: "..nameregex)
	return ngx.eof()
end
file = file[1]

ngx.header["Content-Type"] = "application/octet-stream"
ngx.header['Content-Disposition'] = 'attachment; filename="' .. file.name:gsub('"',"'") .. '"'
ngx.exec("/files/" .. nameregex .. file.extension)
