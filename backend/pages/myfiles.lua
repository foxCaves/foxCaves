dofile(ngx.var.main_root .. "/scripts/global.lua")
if not ngx.ctx.user then return ngx.redirect("/login") end

local database = ngx.ctx.database

local message = ""

if ngx.var.arg_delete_ok == "true" then
	message = '<div class="alert alert-success">Deleted file <a href="/myfiles" class="close" data-dismiss="alert">x</a></div>'
elseif ngx.var.arg_delete_ok == "false" then
	message = '<div class="alert alert-error">Error deleting file <a href="/myfiles" class="close" data-dismiss="alert">x</a></div>'
end

local files = database:zrevrange(database.KEYS.USER_FILES .. ngx.ctx.user.id, 0, -1)
dofile("scripts/fileapi.lua")
printTemplateAndClose("myfiles", {MAINTITLE = "My files", MESSAGE = message, FILES = files, file_get = file_get})
