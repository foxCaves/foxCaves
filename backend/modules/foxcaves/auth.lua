local utils = require('foxcaves.utils')
local cookies = require('foxcaves.cookies')
local redis = require('foxcaves.redis')
local random = require('foxcaves.random')
local user_model = require('foxcaves.models.user')

local ngx = ngx
local tostring = tostring

local SESSION_ID_COOKIE_NAME = 'session_id'
local SESSION_EXPIRE_DELAY = 7200
local SESSION_EXPIRE_DELAY_REMEMBER = 30 * 24 * 60 * 60

local M = {}
require('foxcaves.module_helper').setmodenv()

function M.LOGIN_METHOD_PASSWORD(userdata, credential)
    if not userdata:check_password(credential.password) then
        return false
    end
    if not userdata:check_totp(credential.totp) then
        return false
    end
    return true
end

function M.LOGIN_METHOD_API_KEY(userdata, api_key)
    return userdata.api_key == api_key
end

function M.LOGIN_METHOD_SECURITY_VERSION(userdata, security_version)
    return tostring(userdata.security_version) == tostring(security_version)
end

function M.login(username_or_id, credential, options)
    options = options or {}

    if utils.is_falsy_or_null(username_or_id) or utils.is_falsy_or_null(credential) then
        return false
    end

    local user
    if options.login_with_id then
        user = user_model.get_by_id(username_or_id)
    else
        user = user_model.get_by_username(username_or_id)
    end

    if not user then
        return false
    end

    if not options.login_method(user, credential) then
        return false
    end

    if not options.no_session then
        local session_id = random.string(32)
        local session_id_cookie = {
            key = SESSION_ID_COOKIE_NAME,
            value = session_id,
        }
        ngx.ctx.session_id = session_id

        if options.remember then
            session_id_cookie.max_age = SESSION_EXPIRE_DELAY_REMEMBER
        end

        cookies.set(session_id_cookie)

        session_id = 'sessions:' .. session_id

        local redis_inst = redis.get_shared()
        redis_inst:hmset(
            session_id,
            'id',
            user.id,
            'security_version',
            tostring(user.security_version),
            'remember',
            options.remember and '1' or '0'
        )
        redis_inst:expire(session_id, (session_id_cookie.max_age or 0) + SESSION_EXPIRE_DELAY)
    end

    ngx.ctx.user = user

    return true
end

function M.logout()
    cookies.delete({ key = SESSION_ID_COOKIE_NAME })
    if ngx.ctx.session_id then
        redis.get_shared():del('sessions:' .. ngx.ctx.session_id)
    end
    ngx.ctx.user = nil
end

local function parse_authorization_header(auth)
    if not auth then return end
    if auth:sub(1, 6):lower() ~= 'basic ' then return end
    auth = ngx.decode_base64(auth:sub(7))
    if not auth or auth == '' then return end
    local colonPos = auth:find(':', 1, true)
    if not colonPos then return end
    return auth:sub(1, colonPos - 1), auth:sub(colonPos + 1)
end

function M.check()
    local user, api_key = parse_authorization_header(ngx.var.http_authorization)
    if user and api_key then
        if ngx.ctx.route_opts and ngx.ctx.route_opts.disable_api_key then
            return utils.api_error('This route does not allow API keys', 401)
        end
        local success = M.login(user, api_key, {
            no_session = true,
            login_method = M.LOGIN_METHOD_API_KEY,
        })
        if not success then
            return utils.api_error('Invalid username or API key', 401)
        end
        ngx.ctx.disable_csrf_checks = true
        return
    end

    local session_id = cookies.get(SESSION_ID_COOKIE_NAME)
    if session_id then
        local redis_inst = redis.get_shared()
        local sessionKey = 'sessions:' .. session_id
        local result = redis_inst:hmget(sessionKey, 'id', 'security_version', 'remember')
        local remember = result[3] == '1'
        if not utils.is_falsy_or_null(result) and M.login(result[1], result[2], {
                no_session = true,
                login_with_id = true,
                login_method = M.LOGIN_METHOD_SECURITY_VERSION,
                remember = remember,
            }) then
            ngx.ctx.session_id = session_id
            local session_id_cookie = {
                key = SESSION_ID_COOKIE_NAME,
                value = session_id,
            }
            if remember then
                session_id_cookie.max_age = SESSION_EXPIRE_DELAY_REMEMBER
            end
            cookies.set(session_id_cookie)
            redis_inst:expire(sessionKey, (session_id_cookie.max_age or 0) + SESSION_EXPIRE_DELAY)
        end
    end

    if session_id and not ngx.ctx.user then
        M.logout()
    end
end

return M
