if not ngx then
	local lfs = require("lfs")
	lfs.chdir(ngx.var.main_root.."")
end

local database = ngx.ctx.database

local function s3_request_multi(tbl)
	local reqParams = {}
	for _,req in pairs(tbl) do
		req.method = req.method or ngx.HTTP_GET
		local method_str
		if req.method == ngx.HTTP_GET then
			method_str = "GET"
		elseif req.method == ngx.HTTP_PUT then
			method_str = "PUT"
		elseif req.method == ngx.HTTP_POST then
			method_str = "POST"
		elseif req.method == ngx.HTTP_DELETE then
			method_str = "DELETE"
		end
		
		table.insert(reqParams, {"/scripts/amazon_s3", {
			ctx = {
				amz_content_type = (req.content_type or ""),
				amz_content_disposition = (req.content_disposition or ""),
				amz_cache_control = (req.cache_control or ""),
				amz_key = req.file,
				amz_request_method = method_str
			},
			method = req.method,
			copy_all_vars = false,
			share_all_vars = false,
			body = req.body or ""
		}})
	end
	
	local resps = {ngx.location.capture_multi(reqParams)}
	
	for _,res in next, resps do
		if res.status ~= 200 and res.status ~= 204 then
			local err = ""
			for k,v in next, res do
				err = err .. "\n" .. k .. " => " .. tostring(v)
			end
			for k,v in next, res.header do
				err = err .. "\nHEAD_" .. k .. " => " .. tostring(v)
			end
			if body == nil then
				err = err .. "\nEMPTY BODY"
			else
				err = err .. "\nFILLED BODY"
			end
			error("Request failed: "..err)
		end
	end
	
	return resps
end
local function s3_request(file, method, content_type, cache_control, body, content_disposition)
	local res = s3_request_multi({{file = file, method = method, content_type = content_type, cache_control = cache_control, body = body, content_disposition = content_disposition}})
	return res[1]
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
	if not fileid then return nil end
	local file = database:hgetall(database.KEYS.FILES..fileid)
	if (not file) or (file == ngx.null) or (not file.name) then return nil end
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

	file_manualdelete(fileid .. "/file" .. file.extension)
	if file.thumbnail and file.thumbnail ~= "" then
		file_manualdelete(fileid .. "/thumb" .. file.thumbnail)
	end
	file_manualdelete(fileid)

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

local S3_PARTSIZE = 6 * 1024 * 1024

function file_upload(fileid, filename, extension, thumbnail, filetype, thumbtype)
	local fullname = fileid .. extension
	
	local fileContent = file_fullread("files/" .. fullname)
	local fileSize = fileContent:len()
	if fileSize <= S3_PARTSIZE then
		s3_request(
			fileid .. "/file" .. extension,
			ngx.HTTP_PUT,
			filetype or "application/octet-stream",
			"public, max-age=86400",
			fileContent,
			'inline; filename="'..filename:gsub('"',"'")..'"'
		)
	else
		local fName = fileid .. "/file" .. extension
	
		local uploadID = s3_request(
			fName .. "?uploads",
			ngx.HTTP_POST,
			filetype or "application/octet-stream",
			"public, max-age=86400",
			nil,
			'inline; filename="'..filename:gsub('"',"'")..'"'
		)
		uploadID = ngx.re.match(uploadID.body, "<UploadId>([^<]+)</UploadId>", "o")
		uploadID = "uploadId=" .. uploadID[1]
		
		local partCount = math.floor(fileSize / S3_PARTSIZE)
		
		local completeReply = {"<CompleteMultipartUpload>"}
		
		local requests = {}
		for partNumber = 1,partCount do
			local startPos = ((partNumber - 1) * S3_PARTSIZE) + 1
			local endPos
			if partNumber < partCount then
				endPos = startPos + S3_PARTSIZE
			else
				endPos = fileSize
			end
			
			requests[partNumber] = {
				file = fName .. "?partNumber=" .. partNumber .. "&" .. uploadID,
				method = ngx.HTTP_PUT,
				body = fileContent:sub(startPos, endPos)
			}
		end
		
		local res = s3_request_multi(requests)
		for partNumber,reply in next, res do	
			table.insert(completeReply, "<Part><PartNumber>")
			table.insert(completeReply, partNumber)
			table.insert(completeReply, "</PartNumber><ETag>")
			table.insert(completeReply, reply.header.ETag)
			table.insert(completeReply, "</ETag></Part>")
		end
		
		table.insert(completeReply, "</CompleteMultipartUpload>")
		completeReply = table.concat(completeReply)
		
		s3_request(
				fName .. "?" .. uploadID,
				ngx.HTTP_POST,
				nil,
				nil,
				completeReply,
				nil
		)
	end

	if thumbnail and thumbnail ~= "" then
		s3_request(
			fileid .. "/thumb" .. thumbnail,
			ngx.HTTP_PUT,
			thumbtype or "application/octet-stream",
			"public, max-age=86400",
			file_fullread("thumbs/" .. fileid .. thumbnail)
		)
		os.remove("thumbs/" .. fileid .. thumbnail)
	end

	os.remove("files/"..fullname)
end

function file_push_action(fileid, action)
	action = action or '='
	raw_push_action(action..fileid..'|U'..tostring(ngx.ctx.user.usedbytes))
end
