-- ROUTE:POST:/api/v1/users/emails/request
dofile(ngx.var.main_root .. "/scripts/global.lua")

local database = ngx.ctx.database
local args = ngx.ctx.get_post_args()

local action = args.action or ""
if action == "" then
    return api_error("action required")
end

local username = args.username or ""
if username == "" then
    return api_error("username required")
end

local email = args.email or ""
if email == "" then
    return api_error("email required")
end

local userres = database:query_safe('SELECT * FROM users WHERE username = "%s" AND email = "%s"', username, email)
local userdata = userres[1]
if not userdata then
    ngx.status = 404
    ngx.eof()
    return
end

local emailid = randstr(32)

local email = "Hello, " .. userdata.username .. "!\n\nYou have recently requested to "
local subject
if action == "activation" then
    email = email .. " have your activation E-Mail resent. To activate your user account"
    subject = "foxCaves - Activate your account"
elseif action == "forgotpwd" then
    email = email .. " reset your password. To have a random password sent to you E-Mail"
    subject = "foxCaves - Reset your password"
else
    return api_error("action invalid")
end
email = email .. " just click on the following link:\n" .. MAIN_URL .."/email/code?code=" .. emailid .. "\n\nKind regards,\nfoxCaves Support"

local emailkey = "emailkeys:" .. emailid
database:hmset(emailkey, "user", userid, "action", action)
database:expire(emailkey, 172800) --48 hours

mail(userdata.email, subject, email, "noreply@foxcav.es", "foxCaves")
