-- ROUTE:POST:/api/v1/files
api_ctx_init()
if not ngx.ctx.user then return end

local database = get_ctx_database()

local name = ngx.var.arg_name

if not name then
	return api_error("No name")
end

name = ngx.unescape_uri(name)

local nameregex = ngx.re.match(name, "^([^<>\r\n\t]*?)(\\.[a-zA-Z0-9]+)?$", "o")
if (not nameregex) or (not nameregex[1]) then
	return api_error("Invalid name")
end

local fileid = randstr(10)

ngx.req.read_body()
local file = ngx.req.get_body_file()
local filedata = ngx.req.get_body_data()
if (not file) and (not filedata) then
	return api_error("No body")
end

local filesize = file and lfs.attributes(file, "size") or filedata:len()
if (not filesize) or filesize <= 0 then
	return api_error("Empty body")
end

if user_calculate_usedbytes(ngx.ctx.user) + filesize > ngx.ctx.user.totalbytes then
	return api_error("Over quota", 402)
end

local extension = nameregex[2]
if not extension then
	extension = ".bin"
else
	extension = extension:lower()
end

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

local mtype = mimetypes[extension] or "application/octet-stream"

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
		local content = escape_html(fh:read(4096))

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

database:query_safe('INSERT INTO files (id, name, "user", extension, type, size, time, thumbnail) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)', fileid, name, ngx.ctx.user.id, extension, fileType, filesize, ngx.time(), thumbnail or "")

local filedata = file_get_public(fileid)
file_push_action('create', filedata)
ngx.print(cjson.encode(filedata))
