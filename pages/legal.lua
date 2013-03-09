dofile(ngx.var.main_root .. "/scripts/global.lua")

local site = ngx.var.legal_action:lower()
if site ~= "terms_of_service" and site ~= "privacy_policy" then
	return ngx.exec("/error/404")
end

dofile("scripts/navtbl.lua")
ngx.print(load_template(site, {ADDLINKS = build_nav(navtbl)}))
ngx.eof()