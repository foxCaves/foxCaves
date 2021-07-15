-- ROUTE:GET:/view/{id}
dofile(ngx.var.main_root .. "/scripts/global.lua")

printTemplateAndClose("view", { MAINTITLE = "View file" })
