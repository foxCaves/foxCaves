local utils = require('foxcaves.utils')
local redis = require('foxcaves.redis')
local mail = require('foxcaves.mail')
local random = require('foxcaves.random')
local user_model = require('foxcaves.models.user')
local captcha = require('foxcaves.captcha')
local app_url = require('foxcaves.config').http.app_url

R.register_route('/api/v1/users/emails/request', 'POST', R.make_route_opts_anon(), function()
    -- 48 hours
    local args = utils.get_post_args()

    local action = args.action or ''
    if action == '' then
        return utils.api_error('action required')
    end

    local username = args.username or ''
    if username == '' then
        return utils.api_error('username required')
    end

    local email = args.email or ''
    if email == '' then
        return utils.api_error('email required')
    end

    local user = user_model.get_by_username(username)
    if not user or (user.email:lower() ~= email:lower()) then
        return utils.api_error('User not found', 404)
    end

    local emailid = random.string(32)

    local emailstr = 'You have recently requested to '
    local subject
    if action == 'activation' then
        emailstr = emailstr .. 'have your activation E-Mail resent. To activate your user account'
        subject = 'Activate your account'
        if not captcha.check('resend_activation', args) then
            return captcha.error()
        end
    elseif action == 'forgot_password' then
        emailstr = emailstr .. 'reset your password. To have a random password sent to you E-Mail'
        subject = 'Reset your password'
        if not captcha.check('forgot_password', args) then
            return captcha.error()
        end
    else
        return utils.api_error('action invalid')
    end
    emailstr = emailstr .. ' just click on the following link:\n' .. app_url .. '/email/code/' .. emailid

    local redis_inst = redis.get_shared()
    local emailkey = 'emailkeys:' .. emailid
    redis_inst:hmset(emailkey, 'user', user.id, 'action', action)
    redis_inst:expire(emailkey, 172800)
    mail.send(user, subject, emailstr)

    return { ok = true }
end)
