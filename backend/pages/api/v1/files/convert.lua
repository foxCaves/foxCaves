-- ROUTE:POST:/api/v1/files/{id}/convert
dofile(ngx.var.main_root .. "/scripts/global.lua")
dofile("scripts/api_login.lua")
if not ngx.ctx.user then return end

local fileid = ngx.ctx.route_vars.id

local newextension = ngx.var.arg_newtype:lower()
if newextension ~= "jpg" and newextension ~= "png" and newextension ~= "gif" and newextension ~= "bmp" then
	ngx.status = 400
	ngx.print("badreq")
	return ngx.eof()
end
newextension = "." .. newextension

dofile("scripts/fileapi.lua")

local succ, data, dbdata = file_download(fileid, ngx.ctx.user.id)
if(not succ) or dbdata.extension == newextension or dbdata.type ~= 1 then
	ngx.status = 403
	ngx.print("failed")
	return ngx.eof()
end

local newfilename = dbdata.name
newfilename = newfilename:sub(1, newfilename:len() - dbdata.extension:len()) .. newextension

local database = ngx.ctx.database

local fh = io.open("/var/www/foxcaves/tmp/files/" .. fileid .. dbdata.extension, "w")
fh:write(data)
fh:close()
os.execute('/usr/bin/convert "/var/www/foxcaves/tmp/files/' .. fileid .. dbdata.extension .. '" -format ' .. newextension:sub(2) .. ' "/var/www/foxcaves/tmp/files/' .. fileid .. newextension .. '"')
os.remove("/var/www/foxcaves/tmp/files/" .. fileid .. dbdata.extension)

dofile("scripts/mimetypes.lua")

local newsize = lfs.attributes("/var/www/foxcaves/tmp/files/" .. fileid .. newextension, "size")
if not newsize then
	ngx.status = 500
	ngx.print("failed")
	return ngx.eof()
end

database:hmset(database.KEYS.FILES .. fileid, "extension", newextension, "name", newfilename, "size", newsize)
newsize = newsize - dbdata.size
ngx.ctx.user.usedbytes = ngx.ctx.user.usedbytes + newsize
database:hincrby(database.KEYS.USERS .. ngx.ctx.user.id, newsize)

file_upload(fileid, newfilename, newextension, "", mimetypes[newextension], nil)
file_manualdelete(fileid .. "/file" .. dbdata.extension)

file_push_action('refresh', {
	id = fileid,
	extension = newextension,
	name = newfilename,
	size = newsize,
})

ngx.eof()
