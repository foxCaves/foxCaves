-- ROUTE:GET:/view/{id}
dofile(ngx.var.main_root .. "/scripts/global.lua")

printStaticTemplateAndClose("view", { MAINTITLE = "View file" })
