local b64 = require("ngx.base64")
local utils = require("foxcaves.utils")
local auth_utils = require("foxcaves.auth_utils")
local cookies = require("foxcaves.cookies")
local redis = require("foxcaves.redis")
local random = require("foxcaves.random")
local user_model = require("foxcaves.models.user")

local ngx = ngx

local M = {}
require("foxcaves.module_helper").setmodenv()

local SESSION_EXPIRE_DELAY = 7200

function M.LOGIN_METHOD_PASSWORD(userdata, password)
    return userdata:check_password(password)
end
function M.LOGIN_METHOD_API_KEY(userdata, api_key)
    return userdata.api_key == api_key
end
function M.LOGIN_METHOD_LOGIN_KEY(userdata, login_key)
    return auth_utils.hash_login_key(userdata.login_key) == b64.decode_base64url(login_key)
end

function M.login(username_or_id, credential, options)
    options = options or {}
    local no_session = options.no_session
    local login_with_id = options.login_with_id

    if utils.is_falsy_or_null(username_or_id) or utils.is_falsy_or_null(credential) then
        return false
    end

    local user
    if login_with_id then
        user = user_model.get_by_id(username_or_id)
    else
        user = user_model.get_by_username(username_or_id)
    end

    if not user then
        return false
    end

    local auth_func = options.login_method or M.LOGIN_METHOD_PASSWORD
    if not auth_func(user, credential) then
        return false
    end

    if not no_session then
        local session_id = random.string(32)
        local cookie = cookies.get_instance()
        cookie:set({
            key = "session_id",
            value = session_id,
        })
        ngx.ctx.session_id = session_id

        session_id = "sessions:" .. session_id

        local redis_inst = redis.get_shared()
        redis_inst:hmset(session_id, "id", user.id, "login_key",
                            b64.encode_base64url(auth_utils.hash_login_key(user.login_key)))
        redis_inst:expire(session_id, SESSION_EXPIRE_DELAY)
    end

    ngx.ctx.user = user

    return true
end

function M.logout()
    local cookie = cookies.get_instance()
    cookie:delete({
        key = "session_id",
    })
    cookie:delete({
        key = "login_key",
    })
    if ngx.ctx.session_id then
        redis.get_shared():del("sessions:" .. ngx.ctx.session_id)
    end
    ngx.ctx.user = nil
end

local function parse_authorization_header(auth)
    if not auth then
        return
    end
    if auth:sub(1, 6):lower() ~= "basic " then
        return
    end
    auth = ngx.decode_base64(auth:sub(7))
    if not auth or auth == "" then
        return
    end
    local colonPos = auth:find(":", 1, true)
    if not colonPos then
        return
    end
    return auth:sub(1, colonPos - 1), auth:sub(colonPos + 1)
end

function M.check()
    local user, api_key = parse_authorization_header(ngx.var.http_authorization)
    if user and api_key then
        local success = M.login(user, api_key, {
                            no_session = true, login_method = M.LOGIN_METHOD_API_KEY
                        })
        if not success then
            return utils.api_error("Invalid username or API key", 401)
        end
        return
    end

    local cookie = cookies.get_instance()
    if not cookie then
        return
    end

    local session_id = cookie:get("session_id")
    if session_id then
        local redis_inst = redis.get_shared()
        local sessionKey = "sessions:" .. session_id
        local result = redis_inst:hmget(sessionKey, "id", "login_key")
        if (not utils.is_falsy_or_null(result)) and
                M.login(result[1], result[2], {
                    no_session = true, login_with_id = true, login_method = M.LOGIN_METHOD_LOGIN_KEY
                }) then
            ngx.ctx.session_id = session_id
            cookie:set({
                key = "session_id",
                value = session_id,
            })
            redis_inst:expire(sessionKey, SESSION_EXPIRE_DELAY)
        end
    end

    local login_key = cookie:get("login_key")
    if login_key then
        if not ngx.ctx.user then
            local login_key_match = ngx.re.match(login_key, "^([0-9a-f-]+)\\.([a-zA-Z0-9_-]+)$", "o")
            if login_key_match then
                M.login(login_key_match[1], login_key_match[2], {
                    login_with_id = true, login_method = M.LOGIN_METHOD_LOGIN_KEY
                })
            end
        end

        if ngx.ctx.user then
            ngx.ctx.remember_me = true
            auth_utils.send_login_key()
        end
    end

    if (session_id or login_key) and not ngx.ctx.user then
        M.logout()
    end
end

return M
