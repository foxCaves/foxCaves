-- ROUTE:GET:/emailcode
dofile(ngx.var.main_root .. "/scripts/global.lua")

printTemplateAndClose("emailcode", { MAINTITLE = "E-Mail code check" })
