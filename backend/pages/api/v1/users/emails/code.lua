-- ROUTE:POST:/api/v1/users/emails/code
dofile(ngx.var.main_root .. "/scripts/global.lua")

local database = ngx.ctx.database
local args = ngx.ctx.get_post_args()

local code = args.code or ""
if code == "" then
    return api_error("code required")
end

local codekey = database.KEYS.EMAILKEYS .. ngx.unescape_uri(args.code)
local res = database:hgetall(codekey)
database:del(codekey)

if not (res and res.user and res ~= ngx.null) then
    return api_error("code invalid")
end

local userkey = database.KEYS.USERS .. res.user

local userdata = database:hgetall(userkey)

if res.action == "activation" then
    if userdata.active and (userdata.active == "0" or userdata.active == 0) then
        database:hset(userkey, "active", 1)
    end
elseif res.action == "forgotpwd" then
    dofile("scripts/userapi.lua")

    local newPassword = randstr(16)
    database:hmset(userkey, "password", argon2.hash_encoded(newPassword, randstr(32)))
    userdata.id = res.user
    make_new_login_key(userdata)

    local email = "Hello, " .. userdata.username .. "!\n\nHere is your new password:\n" .. newPassword .. "\nPlease log in at " .. MAIN_URL .. "/login and change it as soon as possible.\n\nKind regards,\nfoxCaves Support"
    mail(userdata.email, "foxCaves - New password", email, "noreply@foxcav.es", "foxCaves")
end

ngx.say(cjson.encode({
    ok = true,
    action = res.action,
})
