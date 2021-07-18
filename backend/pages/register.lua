-- ROUTE:GET:/register
dofile(ngx.var.main_root .. "/scripts/global.lua")

printTemplateAndClose(template_name, {MAINTITLE = "Register"})
