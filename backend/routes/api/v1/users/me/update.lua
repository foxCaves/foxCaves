-- ROUTE:PATCH:/api/v1/users/self
dofile(ngx.var.main_root .. "/scripts/global.lua")
if not ngx.ctx.user then return end

dofile("scripts/userapi.lua")

local database = ngx.ctx.database
ngx.header["Content-Type"] = "application/json"

local args = ngx.ctx.get_post_args()
local user = ngx.ctx.user
local rediskey = database.KEYS.USERS .. user.id

if ngx.hmac_sha1(user.salt, args.current_password or "") ~= user.password then
    return api_error("current_password invalid", 403)
end

user.password = nil
user.loginkey = nil
user.sessionid = nil

if args.email then
    if args.email:lower() == ngx.ctx.user.email:lower() then
        user.email = args.email
        database:hset(rediskey, "email", user.email)
    else
        local emailcheck = ngx.ctx.check_email(args.email)
        if emailcheck == ngx.ctx.EMAIL_INVALID then
            ngx.status = 400
            ngx.print(cjson.encode({ error = "email invalid" }))
            return ngx.eof()
        elseif emailcheck == ngx.ctx.EMAIL_TAKEN then
            ngx.status = 400
            ngx.print(cjson.encode({ error = "email already taken" }))
            return ngx.eof()
        else
            database:sadd(database.KEYS.EMAILS, args.email:lower())
            database:srem(database.KEYS.EMAILS, user.email:lower())
            database:hset(rediskey, "email", args.email)
            -- TODO: re-ask for verification here
            user.email = args.email
        end
    end
end

if args.password then
    database:hset(rediskey, "password", argon2.hash_encoded(args.password, randstr(32)))
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
ngx.eof()
