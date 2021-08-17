local redis = require("foxcaves.redis")
local cjson = require("cjson")

local M = {}
require("foxcaves.module_helper").setmodenv()

function M.push_raw(data, user)
	if user.id then
		user = user.id
	end
	redis.get_shared():publish("push:" .. user, cjson.encode(data))
end

return M
