local resty_cookie = require("resty.cookie")

local ngx = ngx

local M = {}
require("foxcaves.module_helper").setmodenv()

function M.get_instance()
	if ngx.ctx.__cookies then
		return ngx.ctx.__cookies
	end

	local cookies, err = resty_cookie:new()
	if not cookies then
		ngx.log(ngx.ERR, "Failed to parse cookies: " .. err)
		return
	end

    function cookies:set_normal(cookie)
        cookie.path = "/"
        cookie.secure = true
        cookie.httponly = true
        self:set(cookie)
    end

	ngx.ctx.__cookies = cookies
	return cookies
end

return M
