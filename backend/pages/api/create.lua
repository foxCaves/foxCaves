-- ROUTE:POST:/api/create
-- ROUTE:POST:/api/v1/files
dofile(ngx.var.main_root .. "/scripts/global.lua")
dofile("scripts/api_login.lua")
if not ngx.ctx.user then return end

local database = ngx.ctx.database

local name = ngx.var.arg_name

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
	local res = database:exists(database.KEYS.FILES .. fileid)
	if (not res) or (res == ngx.null) or (res == 0) then
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
local filedata = ngx.req.get_body_data()
if (not file) and (not filedata) then
	ngx.status = 400
	ngx.print("No request body")
	return ngx.eof()
end

local filesize = file and lfs.attributes(file, "size") or filedata:len()
if (not filesize) or filesize <= 0 then
	ngx.status = 400
	ngx.print("File empty")
	return ngx.eof()
end

if ngx.ctx.user.usedbytes + filesize > ngx.ctx.user.totalbytes then
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

dofile("scripts/fileapi.lua")

local headers = ngx.req.get_headers()
if headers.x_is_base64 == "yes" then
	if file then
		local f = io.open(file, "rb")
		filedata = f:read("*all")
		f:close()
		os.remove(file)
		file = nil
	end
	filedata = ngx.decode_base64(filedata)
end

if file then
	os.rename(file, "/var/www/foxcaves/tmp/files/" .. fileid .. extension)
else
	f = io.open("/var/www/foxcaves/tmp/files/" .. fileid .. extension, "wb")
	f:write(filedata)
	f:close()
	filedata = nil
end

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
		local thumbext = ".png"
		local thumbnail = fileid .. thumbext
		os.execute(
			string.format(
				'/usr/bin/convert "/var/www/foxcaves/tmp/files/%s%s" -thumbnail x300 -resize "300x<" -resize 50%% -gravity center -crop 150x150+0+0 +repage -format png "/var/www/foxcaves/tmp/thumbs/%s"',
				fileid,
				extension,
				thumbnail
			)
		)

		if not lfs.attributes("/var/www/foxcaves/tmp/thumbs/" .. thumbnail, "size") then
			return FILE_TYPE_IMAGE, nil, nil
		end
		return FILE_TYPE_IMAGE, "image/png", thumbext
	end,

	text = function()
		local fh = io.open("/var/www/foxcaves/tmp/files/" .. fileid .. extension, "r")
		local content = ngx.ctx.escape_html(fh:read(4096))

		if fh:read(1) then
			content = content .. "\n<i>[...]</i>"
		end
		fh:close()

		if content:sub(1,3) == "\xef\xbb\xbf" then
			content = content:sub(4)
		end

		fh = io.open("/var/www/foxcaves/tmp/thumbs/" .. fileid .. extension, "w")
		fh:write(content)
		fh:close()

		return FILE_TYPE_TEXT, "text/plain", extension
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

file_upload(fileid, name, extension, thumbnail, mtype, thumbnailType)

local fileKeyID = database.KEYS.FILES .. fileid

database:hmset(fileKeyID, "name", name, "user", ngx.ctx.user.id, "extension", extension, "type", fileType, "size", filesize, "time", ngx.time())
if thumbnail and thumbnailType then
	database:hset(fileKeyID, "thumbnail", thumbnail)
end
database:zadd(database.KEYS.USER_FILES .. ngx.ctx.user.id, ngx.time(), fileid)

database:hincrby(database.KEYS.USERS .. ngx.ctx.user.id, "usedbytes", filesize)
ngx.ctx.user.usedbytes = ngx.ctx.user.usedbytes + filesize

file_push_action(fileid, 'create')

ngx.header["Content-Type"] = "application/json"
ngx.print(cjson.encode({
	id = fileid,
	name = name,
	extension = extension,
	size = filesize,
	thumbnail = thumbnail or "",
	type = fileType,
	view_url = SHORT_URL .. "/v" .. fileid,
	direct_url = SHORT_URL .. "/f" .. fileid .. extension,
	download_url = SHORT_URL .. "/d" .. fileid .. extension,
}))
ngx.eof()
