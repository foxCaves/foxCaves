local tonumber = tonumber
local next = next
local database = require("foxcaves.database")

local M = {}
require("foxcaves.module_helper").setmodenv()

function M.parse_expiry(args, model, prefix)
    prefix = prefix or ""
    local expires_at = args[prefix .. "expires_at"]
    local expires_in = args[prefix .. "expires_in"]

    if expires_at then
        if expires_at == "" then
            model.expires_at = nil
        else
            model.expires_at = expires_at
        end
        return
    end

    if expires_in then
        expires_in = tonumber(expires_in)
        if expires_in > 0 then
            local res = database.get_shared():query_single(
                "SELECT to_json((now() + %s * (INTERVAL '1 second')) at time zone 'utc') as expires_at", expires_in)
            model.expires_at = res.expires_at
        end
        return
    end
end

function M.delete_expired(model)
    local objects = model.get_by_query("expires_at < now()")
    for _, obj in next, objects do
        obj:delete()
    end
end

return M
