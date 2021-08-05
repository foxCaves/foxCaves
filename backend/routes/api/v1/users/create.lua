-- ROUTE:POST:/api/v1/users
cookies_ctx_init()

local database = ngx.ctx.database
local args = get_post_args()

local username = args.username or ""
local email = args.email or ""
local password = args.password or ""

if username == "" then
    return api_error("username required")
end
if email == "" then
    return api_error("email required")
end
if password == "" then
    return api_error("password required")
end

local usernamecheck = check_username(args.username)
if usernamecheck == EMAIL_INVALID then
    return api_error("username invalid")
elseif usernamecheck == EMAIL_TAKEN then
    return api_error("username taken")
end

local emailcheck = check_email(email)
if emailcheck == EMAIL_INVALID then
    return api_error("email invalid")
elseif emailcheck == EMAIL_TAKEN then
    return api_error("email taken")
end

local res = database:query_safe('INSERT INTO users (username, email, password) VALUES (%s, %s, %s) RETURNING id', username, email, argon2.hash_encoded(password, randstr(32)))
local userid = res[1].id
make_new_login_key({id = userid})
make_new_api_key({id = userid})

user_require_email_confirmation({
    id = userid,
    username = username,
    email = email,
})
