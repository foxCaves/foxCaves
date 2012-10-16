dofile("/var/www/doripush/scripts/global.lua")

if not ngx.ctx.user then
	if ngx.var.http_Authorization then
		ngx.status = 403
		ngx.print("Please update foxScreen")
		return ngx.eof()
	end
	local user = ngx.var.http_X_Foxscreen_User
	local pw = ngx.var.http_X_Foxscreen_Password
	local success = false
	if user and pw then
		success = (ngx.ctx.login(user,pw,true) == ngx.ctx.LOGIN_SUCCESS)
	end
	if not success then
		ngx.status = 403
		ngx.print("Wrong username/password")
		return ngx.eof()
	end
end

local database = ngx.ctx.database

local name = ngx.var.query_string

if not name then
	ngx.status = 403
	ngx.print("No filename")
	ngx.req.discard_body()
	return ngx.eof()
end

name = ngx.unescape_uri(name)

local nameregex = ngx.re.match(name, "^([^<>\r\n\t]*?)(\\.[a-zA-Z0-9]+)?$", "o")
if (not nameregex) or (not nameregex[1]) then
	ngx.status = 403
	ngx.print("Invalid filename")
	ngx.req.discard_body()
	return ngx.eof()
end

local fileid
for i=1,10 do
	fileid = randstr(10)
	local res = database:query("SELECT 1 FROM files WHERE fileid = '"..fileid.."'")
	if (not res) or (not res[1]) then
		break
	else
		fileid = nil
	end
end

if not fileid then
	ngx.status = 500
	ngx.print("Internal error")
	ngx.req.discard_body()
	return ngx.eof()
end

ngx.req.read_body()
local file = ngx.req.get_body_file()
if not file then
	ngx.status = 403
	ngx.print("No request body")
	return ngx.eof()
end

local filesize = lfs.attributes(file, "size")
if tonumber(ngx.ctx.user.usedbytes) + filesize > tonumber(ngx.ctx.user.totalbytes) + tonumber(ngx.ctx.user.bonusbytes) then
	ngx.status = 402
	ngx.print("Overquota")
	return ngx.eof()
end

local extension = nameregex[2]
if not extension then
	extension = ".bin"
else
	extension = extension:lower()
end

os.rename(file, "files/" .. fileid .. extension)

local thumbnail = ""
local ftype = 0

dofile("scripts/mimetypes.lua")
local mtype = mimetypes[extension] or "application/octet-stream"
local thumbtype = nil

if mtype:sub(1,6) == "image/" then
	thumbnail = fileid..".png"
	ftype = 1
	thumbtype = "image/png"

	os.execute('/usr/bin/convert "files/'..fileid..extension..'" -thumbnail x300 -resize "300x<" -resize 50% -gravity center -crop 150x150+0+0 +repage -format png "thumbs/'..thumbnail..'"')
elseif mtype:sub(1,5) == "text/" then
	thumbnail = fileid..extension
	ftype = 2
	local fh = io.open("files/"..fileid..extension, "r")
	local content = fh:read(4096):gsub("&","&amp;"):gsub("<","&lt;"):gsub(">","&gt;")
	if fh:read(1) then
		content = content .. "\n<i>[...]</i>"
	end
	fh:close()

	if content:sub(1,3) == "\xef\xbb\xbf" then
		content = content:sub(4)
	end

	fh = io.open("thumbs/"..thumbnail, "w")
	fh:write(content)
	fh:close()

	thumbtype = "text/plain"
end

dofile("scripts/fileapi.lua")
file_upload(fileid, name, extension, thumbnail, mtype, thumbtype)

database:query("INSERT INTO files (name, fileid, user, extension, time, thumbnail, type, size) VALUES ('"..database:escape(name).."','"..fileid.."','"..ngx.ctx.user.id.."', '"..database:escape(extension).."', UNIX_TIMESTAMP(), '"..thumbnail.."', '"..ftype.."', "..filesize..")")
database:query("UPDATE users SET usedbytes = usedbytes + "..filesize.." WHERE id = '"..ngx.ctx.user.id.."'")

ngx.print("view/" .. fileid)
ngx.eof()
