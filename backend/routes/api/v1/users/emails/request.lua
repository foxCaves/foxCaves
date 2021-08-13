local utils = require("foxcaves.utils")
local redis = require("foxcaves.redis")
local mail = require("foxcaves.mail")
local random = require("foxcaves.random")
local User = require("foxcaves.models.user")
local main_url = require("foxcaves.config").urls.main

R.register_route("/api/v1/users/emails/request", "POST", R.make_route_opts_anon(), function()
    local args = utils.get_post_args()

    local action = args.action or ""
    if action == "" then
        return utils.api_error("action required")
    end

    local username = args.username or ""
    if username == "" then
        return utils.api_error("username required")
    end

    local email = args.email or ""
    if email == "" then
        return utils.api_error("email required")
    end

    local user = User.GetByUsername(username)
    if (not user) or (user.email:lower() ~= email:lower()) then
        return utils.api_error("User not found", 404)
    end

    local emailid = random.string(32)

    local emailstr = "Hello, " .. user.username .. "!\n\nYou have recently requested to "
    local subject
    if action == "activation" then
        emailstr = emailstr .. " have your activation E-Mail resent. To activate your user account"
        subject = "foxCaves - Activate your account"
    elseif action == "forgotpwd" then
        emailstr = emailstr .. " reset your password. To have a random password sent to you E-Mail"
        subject = "foxCaves - Reset your password"
    else
        return utils.api_error("action invalid")
    end
    emailstr = emailstr .. " just click on the following link:\n" .. main_url .."/email/code?code=" .. emailid ..
                            "\n\nKind regards,\nfoxCaves Support"

    local redis_inst = redis.get_shared()
    local emailkey = "emailkeys:" .. emailid
    redis_inst:hmset(emailkey, "user", user.id, "action", action)
    redis_inst:expire(emailkey, 172800) --48 hours

    mail.send(user.email, subject, emailstr, "noreply@foxcav.es", "foxCaves")
end)
