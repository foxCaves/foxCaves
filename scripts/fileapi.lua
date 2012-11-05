if not ngx then
	local lfs = require("lfs")
	lfs.chdir("/var/www/foxcaves")
end

local function s3_request(file, method, content_type, cache_control, body, content_disposition)
	method = method or ngx.HTTP_GET
	local method_str
	if method == ngx.HTTP_GET then
		method_str = "GET"
	elseif method == ngx.HTTP_PUT then
		method_str = "PUT"
	elseif method == ngx.HTTP_DELETE then
		method_str = "DELETE"
	end
	
	local res = ngx.location.capture("/scripts/amazon_s3", {
		ctx = {
			amz_content_type = (content_type or ""),
			amz_content_disposition = (content_disposition or ""),
			amz_cache_control = (cache_control or ""),
			amz_key = file,
			amz_request_method = method_str
		},
		method = method,
		copy_all_vars = false,
		share_all_vars = false,
		body = body
	})
	
	if res.status ~= 200 and res.status ~= 204 then
		local err = ""
		for k,v in pairs(res) do
			err = err .. "\n" .. k .. " => " .. tostring(v)
		end
		for k,v in pairs(res.header) do
			err = err .. "\nHEAD_" .. k .. " => " .. tostring(v)
		end
		error("Request failed: "..err)
	end
	
	return res
end
function get_s3_request()
	return s3_request
end

local function file_fullread(filename)
	local fh = io.open(filename, "r")
	if not fh then return "" end
	local cont = fh:read("*all")
	fh:close()
	return cont
end

function file_manualdelete(file)
	s3_request(file, ngx.HTTP_DELETE)
end

function file_delete(fileid, user)
	local database = ngx.ctx.database

	local id = database:escape(fileid)
	local file = database:query("SELECT name, fileid, thumbnail, extension, size, user FROM files WHERE fileid = '"..id.."'")
	if not (file and file[1]) then return false end
	file = file[1]
	if user and file.user ~= user then return false end

	file_manualdelete("files/" .. file.fileid .. file.extension)
	if file.thumbnail ~= "" then
		file_manualdelete("thumbs/" .. file.thumbnail)
	end

	database:query("DELETE FROM files WHERE fileid = '"..id.."'")

	if file.user then
		database:query("UPDATE users SET usedbytes = usedbytes - "..file.size.." WHERE id = '"..file.user.."'")
		if file.user == ngx.ctx.user.id then
			ngx.ctx.user.usedbytes = ngx.ctx.user.usedbytes - file.size
			file_push_action(file.fileid, '-')
		end
	end

	return true, file.name
end

function file_download(fileid, user)
	local database = ngx.ctx.database

	local id = database:escape(fileid)
	local file = database:query("SELECT name, fileid, thumbnail, extension, size, user FROM files WHERE fileid = '"..id.."'")
	if not (file and file[1]) then return false end
	file = file[1]
	if user and file.user ~= user then return false end

	local res = ngx.location.capture("/f/" .. file.fileid .. file.extension)

	return true, res.body, file
end

function file_upload(fileid, filename, extension, thumbnail, filetype, thumbtype)
	local fullname = fileid .. extension
	
	s3_request(
		"files/"..fullname,
		ngx.HTTP_PUT,
		filetype or "application/octet-stream",
		"public, max-age=86400",
		file_fullread("files/" .. fullname),
		'inline; filename="'..filename:gsub('"',"'")..'"'
	)

	if thumbnail and thumbnail ~= "" then
		s3_request(
			"thumbs/"..thumbnail,
			ngx.HTTP_PUT,
			thumbtype or "application/octet-stream",
			"public, max-age=86400",
			file_fullread("thumbs/" .. thumbnail)
		)
		os.remove("thumbs/" .. thumbnail)
	end

	os.remove("files/"..fullname)
end

function file_push_action(fileid, action)
	action = action or '='
	local res = ngx.location.capture("/scripts/longpoll_push?"..ngx.ctx.user.id.."_"..ngx.ctx.user.pushchan, { method = ngx.HTTP_POST, body = action..fileid..'\nU'..tostring(ngx.ctx.user.usedbytes).."\n" })
end
