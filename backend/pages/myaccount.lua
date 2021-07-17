-- ROUTE:GET:/myaccount
dofile(ngx.var.main_root .. "/scripts/global.lua")

printStaticTemplateAndClose("myaccount", {MAINTITLE = "My account"})
