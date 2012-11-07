dofile(ngx.var.main_root.."/scripts/global.lua")
dofile("scripts/api_login.lua")
if not ngx.ctx.user then return end

dofile("scripts/fileapi.lua")
ngx.print(load_template("filehtml", {fileid = ngx.var.query_string, file_get = file_get}))
ngx.eof()