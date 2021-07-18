-- ROUTE:POST:/api/v1/users
dofile(ngx.var.main_root .. "/scripts/global.lua")

local database = ngx.ctx.database
local args = ngx.ctx.get_post_args()

local username = args.username or ""
local email = args.email or ""
local password = args.password or ""

dofile("scripts/userapi.lua")

if username == "" then
    return api_error("username required")
end
if email == "" then
    return api_error("email required")
end

local usernamecheck = ngx.ctx.check_username(args.username)
if usernamecheck == ngx.ctx.EMAIL_INVALID then
    return api_error("username invalid")
elseif usernamecheck == ngx.ctx.EMAIL_TAKEN then
    return api_error("username taken")
end

local emailcheck = ngx.ctx.check_email(email)
if emailcheck == ngx.ctx.EMAIL_INVALID then
    return api_error("email invalid")
elseif emailcheck == ngx.ctx.EMAIL_TAKEN then
    return api_error("email taken")
end

if password == "" then
    return api_error("password required")
end

local userid = database:incr(database.KEYS.NEXTUSERID)
local salt = randstr(32)
database:hmset(database.KEYS.USERS .. userid, "username", args.username, "email", email, "password", argon2.hash_encoded(args.password, randstr(32)))
database:sadd(database.KEYS.EMAILS, email:lower())
database:set(database.KEYS.USERNAME_TO_ID .. args.username:lower(), userid)
make_new_login_key({id = userid})
make_new_api_key({id = userid})

user_require_email_confirmation({
    id = userid,
    username = args.username,
    email = email,
})
