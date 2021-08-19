local resty_redis = require("resty.redis")
local utils = require("foxcaves.utils")
local config = require("foxcaves.config").redis
local error = error
local ngx = ngx

local M = {}
require("foxcaves.module_helper").setmodenv()

function M.make(close_on_shutdown)
	local database, err = resty_redis:new()
	if not database then
		error("Error initializing DB: " .. err)
	end
	database:set_timeout(60000)

	local ok
	ok, err = database:connect(config.host, config.port)
	if not ok then
		error("Error connecting to DB: " .. err)
	end

	if close_on_shutdown then
		utils.register_shutdown(function()
			database:close()
		end)
	else
		utils.register_shutdown(function()
			database:set_keepalive(config.keepalive_timeout or 10000, config.keepalive_count or 10)
		end)
	end

	return database
end

function M.get_shared()
	local redis = ngx.ctx.__redis
	if redis then
		return redis
	end
	redis = M.make()
	ngx.ctx.__redis = redis
	return redis
end

return M
