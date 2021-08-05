-- ROUTE:POST:/api/v1/users/emails/code
dofile_global()

local database = ngx.ctx.database
local redis = ngx.ctx.redis
local args = ngx.ctx.get_post_args()

local code = args.code or ""
if code == "" then
    return api_error("code required")
end

local codekey = "emailkeys:" .. ngx.unescape_uri(args.code)
local res = redis:hgetall(codekey)
redis:del(codekey)
if not (res and res.user and res ~= ngx.null) then
    return api_error("code invalid")
end

local userres = database:query_safe('SELECT * FROM users WHERE id = %s', res.user)
local userdata = userres[1]
if not userdata then
    return
end

if res.action == "activation" then
    database:query_safe('UPDATE users SET active = 1 WHERE active = 0 AND id = %s', res.user)
elseif res.action == "forgotpwd" then
    dofile("scripts/userapi.lua")

    local newPassword = randstr(16)
    database:query_safe('UPDATE users SET password = %s WHERE id = %s', argon2.hash_encoded(newPassword, randstr(32)), res.user)
    make_new_login_key(userdata)

    local email = "Hello, " .. userdata.username .. "!\n\nHere is your new password:\n" .. newPassword .. "\nPlease log in at " .. MAIN_URL .. "/login and change it as soon as possible.\n\nKind regards,\nfoxCaves Support"
    mail(userdata.email, "foxCaves - New password", email, "noreply@foxcav.es", "foxCaves")
end

ngx.print(cjson.encode({ action = res.action }))
