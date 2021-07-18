-- ROUTE:GET:/email/{action}
dofile(ngx.var.main_root .. "/scripts/global.lua")

local action = ngx.var.action
local actiontitle
if action == "activation" then
	actiontitle = "Activation E-Mail"
elseif action == "forgotpwd" then
	actiontitle = "Forgot password"
else
	ngx.status = 404
	return ngx.eof()
end

printStaticTemplateAndClose("email", {MAINTITLE = actiontitle, ACTION = action}, "email_" .. actiontitle)
