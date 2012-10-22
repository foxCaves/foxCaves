if not ngx then
	local lfs = require("lfs")
	lfs.chdir("/var/www/doripush")
end

dofile("scripts/awsconfig.lua")
local AWS_CLIENT = require 'Spore'.new_from_spec('scripts/amazons3.json', {
	base_url = AWS_S3_ENDPOINT,
})
AWS_CLIENT:enable('Parameter.Default', {
	bucket = AWS_S3_BUCKET,
})
AWS_CLIENT:enable('Auth.AWS', {
	aws_access_key = AWS_ACCESS_KEY,
	aws_secret_key = AWS_SECRET_KEY
})
AWS_S3_ENDPOINT = nil
AWS_S3_BUCKET = nil
AWS_ACCESS_KEY = nil
AWS_SECRET_KEY = nil

function file_manualdelete(file)
	local res = AWS_CLIENT:delete_object({
		object = file
	})
end

function file_delete(fileid, user)
	local database = ngx.ctx.database

	local id = database:escape(fileid)
	local file = database:query("SELECT name, fileid, thumbnail, extension, size, user FROM files WHERE fileid = '"..id.."'")
	if not (file and file[1]) then return false end
	file = file[1]
	if user and file.user ~= user then return false end

	local res = AWS_CLIENT:delete_object({
		object = file.fileid .. file.extension
	})
	if file.thumbnail ~= "" then
		local res = AWS_CLIENT:delete_object({
			object = "t/" .. file.thumbnail
		})
	end

	database:query("DELETE FROM files WHERE fileid = '"..id.."'")

	if file.user then
		database:query("UPDATE users SET usedbytes = usedbytes - "..file.size.." WHERE id = '"..file.user.."'")
		if file.user == ngx.ctx.user.id then
			ngx.ctx.user.usedbytes = ngx.ctx.user.usedbytes - file.size
		end
	end
	
	if user and user == ngx.ctx.user.id then
		file_push_action(file.fileid, '-')
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

	local res = AWS_CLIENT:get_object({
		object = file.fileid .. file.extension
	})

	return true, res.body, file
end

function file_upload(fileid, filename, extension, thumbnail, filetype, thumbtype)
	local fullname = fileid .. extension

	local res = AWS_CLIENT:put_object({
		object = fullname,
		payload = "@files/" .. fullname,
		["content-type"] = filetype or "application/octet-stream",
		["content-disposition"] = 'attachment; filename="'..filename:gsub('"',"'")..'"',
		["cache-control"] = "public, max-age=864000"
	})

	if thumbnail and thumbnail ~= "" then
		local res = AWS_CLIENT:put_object({
			object = "_thumbs/" .. thumbnail,
			payload = "@thumbs/" .. thumbnail,
			["content-type"] = thumbtype or "application/octet-stream",
			["cache-control"] = "public, max-age=864000"
		})
		os.remove("thumbs/" .. thumbnail)
	end

	os.remove("files/"..fullname)
end

function file_push_action(fileid, action)
	action = action or '='
	local res = ngx.location.capture("/scripts/file_push?"..ngx.ctx.user.id.."_"..ngx.ctx.user.pushchan, { method = ngx.HTTP_POST, body = action..fileid..'\n' })
end
