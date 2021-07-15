-- ROUTE:GET:/live/{id}
dofile(ngx.var.main_root .. "/scripts/global.lua")

printTemplateAndClose("live", { MAINTITLE = "Live drawing file" })
