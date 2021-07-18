-- ROUTE:GET:/register
dofile(ngx.var.main_root .. "/scripts/global.lua")

printStaticTemplateAndClose("register", {MAINTITLE = "Register"})
