local utils = require('foxcaves.utils')
local redis = require('foxcaves.redis')
local config = require('foxcaves.config')
local mail = require('foxcaves.mail')
local random = require('foxcaves.random')
local user_model = require('foxcaves.models.user')
local app_url = require('foxcaves.config').http.app_url
local ngx = ngx

local function invalid_code()
    return utils.api_error('code invalid')
end

R.register_route('/api/v1/users/emails/code', 'POST', R.make_route_opts_anon(), function()
    local args = utils.get_post_args()

    local code = args.code or ''
    if code == '' then
        return utils.api_error('code required')
    end

    local redis_inst = redis.get_shared()
    local codekey = 'emailkeys:' .. ngx.unescape_uri(args.code)
    local res = redis_inst:hmget(codekey, 'user', 'action')
    redis_inst:del(codekey)
    if utils.is_falsy_or_null(res) then
        return invalid_code()
    end

    local userid = res[1]
    local action = res[2]
    if utils.is_falsy_or_null(userid) or utils.is_falsy_or_null(action) then
        return invalid_code()
    end

    local user = user_model.get_by_id(userid)
    if not user then
        return utils.api_error('Bad user')
    end

    if action == 'activation' and user.email_valid ~= 1 then
        user.email_valid = 1
        if config.app.require_user_approval and user.approved <= 0 then
            local email =
                'New user ' .. user.username .. ' (ID ' .. user.id .. ') has registered and is waiting for approval.'
            mail.admin_send('Approval queue: ' .. user.username, email)
        end
        user:save()
    elseif action == 'forgot_password' then
        local newPassword = random.string(16)

        user:set_password(newPassword)
        user:make_new_security_version()
        user:save()

        local email =
            'Here is your new password:\n' .. newPassword .. '\nPlease log in at ' .. app_url .. '/login and change it as soon as possible.'
        mail.send(user, 'New password', email)
    end

    return { action = action }
end)
