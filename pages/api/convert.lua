dofile("/var/www/doripush/scripts/global.lua")
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

local fh = io.open("files/"..dbdata.fileid..dbdata.extension, "w")
fh:write(data)
fh:close()
os.execute('/usr/bin/convert "files/'..dbdata.fileid..dbdata.extension..'" -format '..newextension:sub(2)..' "files/'..dbdata.fileid..newextension..'"')
os.remove("files/" .. dbdata.fileid .. dbdata.extension)

dofile("scripts/mimetypes.lua")

local newsize = lfs.attributes("files/"..dbdata.fileid..newextension, "size")
if not newsize then
	ngx.status = 500
	ngx.print("failed")
	return ngx.eof()
end

database:query("UPDATE files SET extension = '"..newextension.."', name = '"..database:escape(newfilename).."', size = "..newsize.." WHERE fileid = '"..dbdata.fileid.."'")
newsize = newsize - dbdata.size
ngx.ctx.user.usedbytes = ngx.ctx.user.usedbytes + newsize
database:query("UPDATE users SET usedbytes = usedbytes + ("..newsize..") WHERE id = "..ngx.ctx.user.id)

file_upload(dbdata.fileid, newfilename, newextension, "", mimetypes[newextension], nil)
file_manualdelete(dbdata.fileid .. dbdata.extension)

file_push_action(dbdata.fileid, '=')

ngx.print("+++")
ngx.eof()