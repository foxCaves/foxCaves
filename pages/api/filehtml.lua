dofile("/var/www/doripush/scripts/global.lua")
dofile("scripts/api_login.lua")

local database = ngx.ctx.database
local file = database:query("SELECT * FROM files WHERE fileid = '"..database:escape(ngx.var.query_string).."'")

if not file then
	ngx.print("")
	return ngx.eof()
end

ngx.print(load_template("filehtml", {file = file[1]}))
ngx.eof()