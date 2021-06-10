dofile(ngx.var.main_root .. "/scripts/global.lua")

local error_num = tonumber(ngx.var.path_element or "400")

if error_num < 400 or error_num > 599 then
    error_num = 500
end

ngx.status = error_num

printTemplateAndClose("error", {MAINTITLE = "Error " .. error_num, ERROR_NUM = error_num})
