-- ROUTE:GET:/myfiles
dofile(ngx.var.main_root .. "/scripts/global.lua")
if not ngx.ctx.user then return ngx.redirect("/login") end

printTemplateAndClose("myfiles", {MAINTITLE = "My files", MESSAGE = message})
