dofile("/var/www/foxcaves/scripts/global.lua")

if ngx.ctx.user.id ~= 1 then
	ngx.status = 403
	ngx.print("NO")
	return ngx.eof()
end

dofile("scripts/fileapi.lua")
local database = ngx.ctx.database
local AWS_CLIENT = file_get_awsclient()

function match_files(prefix)
	return ngx.re.gmatch(AWS_CLIENT:get_bucket({
		prefix = prefix,
		delimiter = "/",
		["max-keys"] = 10000
	}).body, "<Key>"..prefix.."([^<]+)</Key>")
end

local allfiles_db_q = database:query("SELECT CONCAT(fileid, extension) AS fullname, thumbnail, fileid FROM files")
local allfiles_db = {}
local allthumbs_db = {}
for k,f in pairs(allfiles_db_q) do
	allfiles_db[f.fullname] = f.fileid
	if f.thumbnail and f.thumbnail ~= "" then
		allthumbs_db[f.thumbnail] = f.fileid
	end
end
allfiles_db_q = nil

local allfiles_s3 = {}
for filex in match_files("files/") do
	local file = filex[1]
	allfiles_s3[file] = true
	if not (allfiles_db[file]) then
		ngx.print("Found FILE in S3 but not in DB: "..file.."\n")
		file_manualdelete("files/"..file)
	end
end
for file,fileid in pairs(allfiles_db) do
	if not allfiles_s3[file] then
		ngx.print("Found FILE in DB but not in S3: "..file.."\n")
		database:query("DELETE FROM files WHERE fileid = '"..database:escape(fileid).."'")
	end
end

allfiles_s3 = {}
for filex in match_files("thumbs/") do
	local file = filex[1]
	allfiles_s3[file] = true
	if not (allthumbs_db[file]) then
		ngx.print("Found THUMBNAIL in S3 but not in DB: "..file.."\n")
		file_manualdelete("thumbs/"..file)
	end
end
for thumb,fileid in pairs(allthumbs_db) do
	if not allfiles_s3[thumb] then
		ngx.print("Found THUMBNAIL in DB but not in S3: "..thumb.."\n")
		database:query("UPDATE files SET thumbnail = '' WHERE fileid = '"..database:escape(fileid).."'")
	end
end

ngx.print("Check DONE\n")
ngx.eof()
