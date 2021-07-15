-- ROUTE:GET:/cam
dofile(ngx.var.main_root .. "/scripts/global.lua")

printTemplateAndClose("live", { MAINTITLE = "Cam" })
