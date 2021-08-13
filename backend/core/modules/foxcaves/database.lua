local utils = require("foxcaves.utils")
local config = require("foxcaves.config").postgres
local pgmoon = require("pgmoon")
local next = next
local error = error
local ngx = ngx
local unpack = unpack

local M = {}
setfenv(1, M)

config.socket_type = "nginx"

function M.make()
	local database = pgmoon.new(config)
	local isok, err = database:connect()
	if not isok then
		error(err)
	end

	function database:query_safe(query, ...)
		local args = {...}
		for i,v in next, args do
			args[i] = database:escape_literal(v)
		end
		query = query:format(unpack(args))
		local res, qerr = self:query(query)
		if not res then
			error(qerr)
		end
		return res
	end

	function database:query_safe_single(query, ...)
		local res = self:query_safe(query, ...)
		return res[1]
	end

	utils.register_shutdown(function()
		database:keepalive(config.keepalive_timeout or 10000, config.keepalive_count or 10)
	end)

	return database
end

function M.get_shared()
	local database = ngx.ctx.__database
	if database then
		return database
	end
	database = M.make()
	ngx.ctx.__database = database
	return database
end

return M
