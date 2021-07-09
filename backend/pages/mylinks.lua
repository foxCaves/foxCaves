-- ROUTE:GET:/mylinks
dofile(ngx.var.main_root .. "/scripts/global.lua")
if not ngx.ctx.user then return ngx.redirect("/login") end

local message = ""

if ngx.var.arg_delete_ok == "true" then
	message = '<div class="alert alert-success">Deleted link <a href="/mylinks" class="close" data-dismiss="alert">x</a></div>'
elseif ngx.var.arg_delete_ok == "false" then
	message = '<div class="alert alert-error">Could not delete the link <a href="/mylinks" class="close" data-dismiss="alert">x</a></div>'
end

printTemplateAndClose("mylinks", {MAINTITLE = "My links", MESSAGE = message})
