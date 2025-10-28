local tonumber = tonumber
local next = next
local database = require('foxcaves.database')

local M = {}
require('foxcaves.module_helper').setmodenv()

function M.parse_expiry(args, model, prefix)
    prefix = prefix or ''
    local expires_at = args[prefix .. 'expires_at']
    local expires_in = args[prefix .. 'expires_in']

    if expires_at then
        if expires_at == '' then
            model.expires_at = nil
        else
            model.expires_at = expires_at
        end
        return
    end

    if expires_in then
        expires_in = tonumber(expires_in)
        if expires_in > 0 then
            local res =
                database.get_shared():query_single(
                    'SELECT CAST((now() + %s * INTERVAL 1 second) AS JSON) AS expires_at_str',
                    nil,
                    expires_in
                )
            model.expires_at = res.expires_at_str
        elseif expires_in < 0 then
            model.expires_at = nil
        end
        return
    end
end

function M.delete_expired(model)
    local query = '(expires_at IS NOT NULL AND expires_at < now())'
    if model.expired_query then
        query = query .. ' OR (' .. model.expired_query .. ')'
    end
    local objects = model.get_by_query_raw(query)
    for _, obj in next, objects do
        obj:delete()
    end
    return objects
end

return M
