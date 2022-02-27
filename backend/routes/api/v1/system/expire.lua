local expiry_utils = require("foxcaves.expiry_utils")
local link_model = require("foxcaves.models.link")
local file_model = require("foxcaves.models.file")

R.register_route("/api/v1/system/expire", "POST", R.make_route_opts_anon(), function()
    expiry_utils.delete_expired(link_model)
    expiry_utils.delete_expired(file_model)

    return { ok = true }
end)
