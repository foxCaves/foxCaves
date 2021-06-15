-- ROUTE:GET:/cam
dofile(ngx.var.main_root .. "/scripts/global.lua")
if not ngx.ctx.user then return ngx.redirect("/login") end

printTemplateAndClose("live", {
	MAINTITLE = "Cam"
})
