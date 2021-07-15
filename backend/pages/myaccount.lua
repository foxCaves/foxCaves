-- ROUTE:GET:/myaccount
dofile(ngx.var.main_root .. "/scripts/global.lua")

printTemplateAndClose("myaccount", {MAINTITLE = "My account"})
