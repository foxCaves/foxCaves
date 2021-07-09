-- ROUTE:GET:/view/{id}
dofile(ngx.var.main_root .. "/scripts/global.lua")

local fileid = ngx.ctx.route_vars.id

if not fileid then
	return ngx.exec("/error/400")
end

printTemplateAndClose("view", { MAINTITLE = "View file" })
