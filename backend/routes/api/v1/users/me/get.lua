-- ROUTE:GET:/api/v1/users/self
api_ctx_init()
if not ngx.ctx.user then return end

local user = ngx.ctx.user
user.password = nil
user.loginkey = nil
user.sessionid = nil
user.salt = nil
user.usedbytes = user_calculate_usedbytes(user)
ngx.print(cjson.encode(user))
