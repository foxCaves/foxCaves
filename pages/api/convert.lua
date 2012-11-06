dofile("/var/www/foxcaves/scripts/global.lua")
dofile("scripts/api_login.lua")
if not ngx.ctx.user then return end

if(not ngx.ctx.user.is_pro) then
	ngx.status = 402
	ngx.print("not pro")
	return ngx.eof()
end

local args = ngx.req.get_uri_args()
if not args and args.fileid then
	ngx.status = 400
	ngx.print("badreq")
	return ngx.eof()
end

local newextension = args.newtype:lower()
if newextension ~= "jpg" and newextension ~= "png" and newextension ~= "gif" and newextension ~= "bmp" then
	ngx.status = 400
	ngx.print("badreq")
	return ngx.eof()	
end
newextension = "."..newextension

dofile("scripts/fileapi.lua")

local succ, data, dbdata = file_download(args.fileid, ngx.ctx.user.id)
if(not succ) or dbdata.extension == newextension or dbdata.type ~= 1 then
	ngx.status = 403
	ngx.print("failed")
	return ngx.eof()
end

local newfilename = dbdata.name
newfilename = newfilename:sub(1, newfilename:len() - dbdata.extension:len())..newextension

local database = ngx.ctx.database

local fh = io.open("files/"..args.fileid..dbdata.extension, "w")
fh:write(data)
fh:close()
os.execute('/usr/bin/convert "files/'..args.fileid..dbdata.extension..'" -format '..newextension:sub(2)..' "files/'..args.fileid..newextension..'"')
os.remove("files/" .. args.fileid .. dbdata.extension)

dofile("scripts/mimetypes.lua")

local newsize = lfs.attributes("files/"..args.fileid..newextension, "size")
if not newsize then
	ngx.status = 500
	ngx.print("failed")
	return ngx.eof()
end

database:hmset(database.KEYS.FILES..args.fileid, "extension", newextension, "name", newfilename, "size", newsize)
newsize = newsize - dbdata.size
ngx.ctx.user.usedbytes = ngx.ctx.user.usedbytes + newsize
database:hincrby(database.KEYS.USERS..ngx.ctx.user.id, newsize)

file_upload(args.fileid, newfilename, newextension, "", mimetypes[newextension], nil)
file_manualdelete(args.fileid .. dbdata.extension)

file_push_action(args.fileid, '=')

ngx.print("+++")
ngx.eof()