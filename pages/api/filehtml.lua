dofile("/var/www/foxcaves/scripts/global.lua")
dofile("scripts/api_login.lua")
if not ngx.ctx.user then return end

local database = ngx.ctx.database
local file = database:query("SELECT * FROM files WHERE fileid = '"..database:escape(ngx.var.query_string).."' AND user = '"..ngx.ctx.user.id.."'")

if not (file and file[1]) then
	ngx.print("-")
	return ngx.eof()
end

ngx.print(load_template("filehtml", {file = file[1]}))
ngx.eof()