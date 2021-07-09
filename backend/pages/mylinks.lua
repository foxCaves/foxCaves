-- ROUTE:GET:/mylinks
dofile(ngx.var.main_root .. "/scripts/global.lua")
if not ngx.ctx.user then return ngx.redirect("/login") end

printTemplateAndClose("mylinks", {MAINTITLE = "My links"})
