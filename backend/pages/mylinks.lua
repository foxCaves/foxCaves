-- ROUTE:GET:/mylinks
dofile(ngx.var.main_root .. "/scripts/global.lua")

printTemplateAndClose("mylinks", {MAINTITLE = "My links"})
