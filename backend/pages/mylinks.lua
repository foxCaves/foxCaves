-- ROUTE:GET:/mylinks
dofile(ngx.var.main_root .. "/scripts/global.lua")

printStaticTemplateAndClose("mylinks", {MAINTITLE = "My links"})
