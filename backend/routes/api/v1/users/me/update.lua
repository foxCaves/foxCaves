-- ROUTE:PATCH:/api/v1/users/self
cookies_ctx_init()
if not ngx.ctx.user then return api_not_logged_in_error() end

local database = ngx.ctx.database

local args = get_post_args()
local user = ngx.ctx.user

--[[
if not check_user_password(user, args.current_password or "") then
    return api_error("current_password invalid", 403)
end
]]

user.password = nil
user.loginkey = nil
user.sessionid = nil

if args.email then
    if args.email:lower() == ngx.ctx.user.email:lower() then
        user.email = args.email
    else
        local emailcheck = check_email(args.email)
        if emailcheck == VALIDATION_STATE_INVALID then
            ngx.status = 400
            ngx.print(cjson.encode({ error = "email invalid" }))
            return
        elseif emailcheck == VALIDATION_STATE_TAKEN then
            ngx.status = 400
            ngx.print(cjson.encode({ error = "email already taken" }))
            return
        else
            -- TODO: re-ask for verification here
            user.email = args.email
        end
    end
    database:query_safe('UPDATE users SET email = %s WHERE id = %s', user.email, user.id)
end

if args.password then
    database:query_safe('UPDATE users SET password = %s WHERE id = %s', argon2.hash_encoded(args.password, randstr(32)), user.id)
    user.password = "CHANGED"
    args.loginkey = "CHANGE"
end

if args.apikey then
    make_new_api_key()
end

if args.loginkey then
	make_new_login_key()
    user.loginkey = "CHANGED"
end

ngx.print(cjson.encode(user))
