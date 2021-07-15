-- ROUTE:GET:/myfiles
dofile(ngx.var.main_root .. "/scripts/global.lua")

printTemplateAndClose("myfiles", {MAINTITLE = "My files"})
