-- ROUTE:POST:/api/v1/users/@me/login
dofile(ngx.var.main_root .. "/scripts/global.lua")

local args = ngx.ctx.get_post_args()
if not args then
    return api_error("No args")
end

if not args.username or args.username == "" then
    return api_error("No username")
end

if not args.password or args.password == "" then
    return api_error("No password")
end

local result = ngx.ctx.login(args.username, args.password)
if result == ngx.ctx.LOGIN_USER_INACTIVE then
    api_error("Account inactive")
elseif result == ngx.ctx.LOGIN_USER_BANNED then
    api_error("Account banned")
elseif result == ngx.ctx.LOGIN_BAD_PASSWORD then
    api_error("Invalid username/password")
elseif result ~= ngx.ctx.LOGIN_SUCCESS then
    api_error("Unknown login error")
else
    if args.remember == "yes" then
        ngx.ctx.user.remember_me = true
        ngx.ctx.send_login_key()
    end
    ngx.eof()
end
