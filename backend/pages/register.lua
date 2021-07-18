-- ROUTE:GET:/register
dofile(ngx.var.main_root .. "/scripts/global.lua")

printStaticTemplateAndClose(template_name, {MAINTITLE = "Register"})
