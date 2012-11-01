dofile("/var/www/doripush/scripts/global.lua")
dofile("scripts/api_login.lua")
if not ngx.ctx.user then return end

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
for i=1, 10 do
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
	ngx.status = 400
	ngx.print("No request body")
	return ngx.eof()
end

local filesize = lfs.attributes(file, "size")
if (not filesize) or filesize <= 0 then
	ngx.status = 400
	ngx.print("File empty")
	return ngx.eof()
end

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

dofile("scripts/mimetypes.lua")
local mtype = mimetypes[extension] or "application/octet-stream"

local FILE_TYPE_OTHER = 0
local FILE_TYPE_IMAGE = 1
local FILE_TYPE_TEXT = 2
local FILE_TYPE_VIDEO = 3
local FILE_TYPE_AUDIO = 4
local FILE_TYPE_IFRAME = 5

local mimeHandlers = {
	image = function()
		local thumbnail = fileid..".png"
		os.execute(
			string.format(
				'/usr/bin/convert "files/%s%s" -thumbnail x300 -resize "300x<" -resize 50%% -gravity center -crop 150x150+0+0 +repage -format png "thumbs/%s"',
				fileid,
				extension,
				thumbnail
			)
		)
		
		if not lfs.attributes("thumbs/"..thumbnail, "size") then
			return FILE_TYPE_IMAGE, nil, nil
		end
		return FILE_TYPE_IMAGE, "image/png", thumbnail
	end,
	
	text = function()
		local fh = io.open("files/"..fileid..extension, "r")
		local content = fh:read(4096):gsub("[&<>]", {
			["&"] = "&amp;",
			["<"] = "&lt;",
			[">"] = "&gt;",
		})
		
		if fh:read(1) then
			content = content .. "\n<i>[...]</i>"
		end
		fh:close()

		if content:sub(1,3) == "\xef\xbb\xbf" then
			content = content:sub(4)
		end

		fh = io.open("thumbs/"..fileid..extension, "w")
		fh:write(content)
		fh:close()

		return FILE_TYPE_TEXT, "text/plain", fileid..extension
	end,
	
	video = function()
		return FILE_TYPE_VIDEO, nil, nil
	end,
	
	audio = function()
		return FILE_TYPE_AUDIO, nil, nil
	end,
	
	application = function(suffix)
		if(suffix == "pdf") then
			return FILE_TYPE_IFRAME, nil, nil
		end
		return FILE_TYPE_OTHER, nil, nil
	end
}

local prefix, suffix = mtype:match("([a-z]+)/([a-z]+)")

local fileType, thumbnailType, thumbnail = mimeHandlers[prefix](suffix)

dofile("scripts/fileapi.lua")
file_upload(fileid, name, extension, thumbnail, mtype, thumbnailType)

database:query(
	string.format(
		"INSERT INTO files (name, fileid, user, extension, time, thumbnail, type, size) VALUES ('%s','%s','%u', '%s', UNIX_TIMESTAMP(), '%s', '%u', '%u')",
		database:escape(name),
		fileid,
		ngx.ctx.user.id,
		database:escape(extension),
		thumbnail or "",
		fileType,
		filesize
	)
)

database:query("UPDATE users SET usedbytes = usedbytes + "..filesize.." WHERE id = '"..ngx.ctx.user.id.."'")
ngx.ctx.user.usedbytes = ngx.ctx.user.usedbytes + filesize

file_push_action(fileid, '+')

ngx.print(
	string.format(
		"v/%s\n%s>%s>%s>%u>%s>%u\n",
		fileid,
		fileid,
		name,
		extension,
		filesize,
		thumbnail or "",
		fileType
	)
)
ngx.eof()
