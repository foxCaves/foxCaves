dofile(ngx.var.main_root .. "/scripts/global.lua")

local site = ngx.var.path_element
if site ~= "terms_of_service" and site ~= "privacy_policy" then
	return ngx.exec("/error/404")
end

printTemplateAndClose(site, {})
