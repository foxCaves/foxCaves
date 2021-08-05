-- ROUTE:POST:/api/v1/files/{id}/convert
dofile_global()
dofile("scripts/api_login.lua")
if not ngx.ctx.user then return end

local fileid = ngx.ctx.route_vars.id

local newextension = ngx.var.arg_newtype:lower()
if newextension ~= "jpg" and newextension ~= "png" and newextension ~= "gif" and newextension ~= "bmp" then
	ngx.status = 400
	ngx.print("badreq")
	return
end
newextension = "." .. newextension

dofile("scripts/fileapi.lua")

local succ, data, dbdata = file_download(fileid, ngx.ctx.user.id)
if(not succ) or dbdata.extension == newextension or dbdata.type ~= 1 then
	ngx.status = 403
	ngx.print("failed")
	return
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
	return
end

database:query_safe('UPDATE files SET extension = %s, name = %s, size = %s WHERE id = %s', newextension, newfilename, newsize, fileid)
newsize = newsize - dbdata.size
ngx.ctx.user.usedbytes = ngx.ctx.user.usedbytes + newsize

file_upload(fileid, newfilename, newextension, "", mimetypes[newextension], nil)
file_manualdelete(fileid .. "/file" .. dbdata.extension)

file_push_action('refresh', {
	id = fileid,
	extension = newextension,
	name = newfilename,
	size = newsize,
})
