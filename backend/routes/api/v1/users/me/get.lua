-- ROUTE:GET:/api/v1/users/self
dofile(ngx.var.main_root .. "/scripts/global.lua")
dofile("scripts/api_login.lua")
if not ngx.ctx.user then return end

ngx.header["Content-Type"] = "application/json"

local user = ngx.ctx.user
user.password = nil
user.loginkey = nil
user.sessionid = nil
user.salt = nil
ngx.print(cjson.encode(user))
ngx.eof()
