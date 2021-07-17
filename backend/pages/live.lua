-- ROUTE:GET:/live/{id}
dofile(ngx.var.main_root .. "/scripts/global.lua")

printStaticTemplateAndClose("live", { MAINTITLE = "Live drawing file" })
