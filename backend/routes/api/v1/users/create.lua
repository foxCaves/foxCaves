local utils = require("foxcaves.utils")
local consts = require("foxcaves.consts")
local User = require("foxcaves.models.user")

register_route("/api/v1/users", "POST", make_route_opts_anon(), function()
    local args = utils.get_post_args()

    local username = args.username or ""
    local email = args.email or ""
    local password = args.password or ""

    if args.agreetos ~= "yes" then
        return utils.api_error("agreetos required")
    end
    if username == "" then
        return utils.api_error("username required")
    end
    if email == "" then
        return utils.api_error("email required")
    end
    if password == "" then
        return utils.api_error("password required")
    end

    local user = User.New()
    user.active = 0
    user.bonusbytes = 0
    
    local usernamecheck = user:SetUsername(username)
    if usernamecheck == consts.VALIDATION_STATE_INVALID then
        return utils.api_error("username invalid")
    elseif usernamecheck == consts.VALIDATION_STATE_TAKEN then
        return utils.api_error("username taken")
    end
    
    local emailcheck = user:SetEMail(email)
    if emailcheck == consts.VALIDATION_STATE_INVALID then
        return utils.api_error("email invalid")
    elseif emailcheck == consts.VALIDATION_STATE_TAKEN then
        return utils.api_error("email taken")
    end
    
    user:SetPassword(password)
    user:MakeNewAPIKey()
    user:MakeNewLoginKey()
    
    user:Save()

    user:ComputeVirtuals()
    
    return user:GetPrivate()
end)
