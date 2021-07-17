-- ROUTE:GET:/cam
dofile(ngx.var.main_root .. "/scripts/global.lua")

printStaticTemplateAndClose("live", { MAINTITLE = "Cam" })
