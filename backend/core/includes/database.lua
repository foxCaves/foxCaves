local utils = require("utils")

local pgmoon = require("pgmoon")
local next = next

CONFIG.postgres.socket_type = "nginx"

function make_database()
	local database = pgmoon.new(CONFIG.postgres)
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
		local res, err = self:query(query)
		if not res then
			error(err)
		end
		return res
	end

	utils.register_shutdown(function() database:keepalive(CONFIG.postgres.keepalive_timeout or 10000, CONFIG.postgres.keepalive_count or 10) end)

	return database
end

function get_ctx_database()
	local database = ngx.ctx.__database
	if database then
		return database
	end
	database = make_database()
	ngx.ctx.__database = database
	return database
end
