-- ROUTE:GET:/
dofile(ngx.var.main_root .. "/scripts/global.lua")

printStaticTemplateAndClose("index", {MAINTITLE = "Home"})
