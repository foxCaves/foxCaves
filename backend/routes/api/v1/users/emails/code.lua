local utils = require("foxcaves.utils")
local redis = require("foxcaves.redis")
local mail = require("foxcaves.mail")
local random = require("foxcaves.random")
local User = require("foxcaves.models.user")
local main_url = require("foxcaves.config").urls.main
local ngx = ngx

R.register_route("/api/v1/users/emails/code", "POST", R.make_route_opts_anon(), function()
    local args = utils.get_post_args()

    local code = args.code or ""
    if code == "" then
        return utils.api_error("code required")
    end

    local redis_inst = redis.get_shared()
    local codekey = "emailkeys:" .. ngx.unescape_uri(args.code)
    local res = redis_inst:hmget(codekey, "user", "action")
    redis_inst:del(codekey)
    if (not res) or (res == ngx.null) or (not res[1]) or (res[1] == ngx.null) then
        return utils.api_error("code invalid")
    end

    local user = User.GetByID(res[1])
    if not user then
        return utils.api_error("Bad user")
    end

    local action = res[2]

    if action == "activation" then
        user.active = 1
        user:Save()
    elseif action == "forgotpwd" then
        local newPassword = random.string(16)

        user:SetPassword(newPassword)
        user:MakeNewLoginKey()
        user:Save()

        local email = "Hello, " .. user.username .. "!\n\nHere is your new password:\n" .. newPassword ..
                        "\nPlease log in at " .. main_url .. "/login and change it as soon as possible." ..
                        "\n\nKind regards,\nfoxCaves Support"
        mail.send(user.email, "foxCaves - New password", email, "noreply@foxcav.es", "foxCaves")
    end

    return { action = action }
end)
