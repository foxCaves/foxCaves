dofile("/var/www/doripush/scripts/global.lua")
dofile("scripts/fileapi.lua")

--[[local files = ngx.ctx.database:query("SELECT * FROM files")
for k,file in pairs(files) do
	local thumb
	if file.thumbnail == "" then
		thumb = nil
	else
		thumb = file.thumbnail
	end

	local fh = io.open(file.fileid .. file.extension)
	if fh then
		fh:close()
		file_upload(file.fileid, file.name, file.extension, thumb)
		ngx.print("Uploading:" .. file.fileid)
	end
end
ngx.eof()]]
