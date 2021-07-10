-- ROUTE:GET,POST:/login
dofile(ngx.var.main_root .. "/scripts/global.lua")

printTemplateAndClose("login", { MAINTITLE = "Login" })
