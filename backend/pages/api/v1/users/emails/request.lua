-- ROUTE:POST:/api/v1/users/emails/request
dofile(ngx.var.main_root .. "/scripts/global.lua")
dofile("scripts/api_login.lua")

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

local userid = database:get(database.KEYS.USERNAME_TO_ID .. username:lower())
local userdata
if userid and userid ~= ngx.null then
    userdata = database:hgetall(database.KEYS.USERS .. userid)
else
    userid = nil
end
if (not userid) or (userdata.email:lower() ~= email:lower()) then
    return api_error("user not found")
end

local emailid
for i=1,10 do
    emailid = randstr(32)
    local res = database:exists(database.KEYS.EMAILKEYS .. emailid)
    if (not res) or (res == ngx.null) or (res == 0) then
        break
    else
        emailid = nil
    end
end

if not emailid then
    ngx.status = 500
    return ngx.eof()
end

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
email = email .. " just click on the following link:\n" .. MAIN_URL .."/emailcode?code=" .. emailid .. "\n\nKind regards,\nfoxCaves Support"

database:hmset(database.KEYS.EMAILKEYS .. emailid, "user", userid, "action", action)
database:expire(172800) --48 hours

message = "<div class='alert alert-warning'>E-Mail sent.</div>"
template_name = "message"
mail(userdata.email, subject, email, "noreply@foxcav.es", "foxCaves")
