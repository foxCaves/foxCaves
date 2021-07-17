-- ROUTE:GET:/error/{code}
dofile(ngx.var.main_root .. "/scripts/global.lua")

local error_num = tonumber(ngx.ctx.route_vars.code or "400")

if error_num < 400 or error_num > 599 then
    error_num = 500
end

ngx.status = error_num

printStaticTemplateAndClose("error", {MAINTITLE = "Error " .. error_num, ERROR_NUM = error_num}, "error_" .. error_num)
