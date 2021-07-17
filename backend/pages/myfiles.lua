-- ROUTE:GET:/myfiles
dofile(ngx.var.main_root .. "/scripts/global.lua")

printStaticTemplateAndClose("myfiles", {MAINTITLE = "My files"})
