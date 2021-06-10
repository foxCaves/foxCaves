dofile(ngx.var.main_root .. "/scripts/global.lua")

local error_num = tonumber(ngx.var.path_element or "400")

ngx.status = error_num

printTemplateAndClose("error", {MAINTITLE = "Error " .. error_num, ERROR_NUM = error_num})
