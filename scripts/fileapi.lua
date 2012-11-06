if not ngx then
	local lfs = require("lfs")
	lfs.chdir("/var/www/foxcaves")
end

local database = ngx.ctx.database

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

function file_get(fileid, user)
	local file = database:hgetall(database.KEYS.FILES..fileid)
	if not file then return nil end
	if user and file.user ~= user then return nil end
	file.type = tonumber(file.type)
	return file
end

function file_manualdelete(file)
	s3_request(file, ngx.HTTP_DELETE)
end

function file_delete(fileid, user)
	local file = file_get(fileid, user)
	if not file then return false end

	file_manualdelete("files/" .. fileid .. file.extension)
	if file.thumbnail and file.thumbnail ~= "" then
		file_manualdelete("thumbs/" .. file.thumbnail)
	end

	database:zrem(database.KEYS.USER_FILES..file.user, fileid)
	database:del(database.KEYS.FILES..fileid)

	if file.user then
		database:hincrby(database.KEYS.USERS..file.user, "usedbytes", -file.size)
		if file.user == ngx.ctx.user.id then
			ngx.ctx.user.usedbytes = ngx.ctx.user.usedbytes - file.size
			file_push_action(fileid, '-')
		end
	end

	return true, file.name
end

function file_download(fileid, user)
	local file = file_get(fileid, user)
	if not file then return false end

	local res = ngx.location.capture("/f/" .. fileid .. file.extension)

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
