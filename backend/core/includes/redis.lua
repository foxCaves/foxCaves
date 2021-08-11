local resty_redis = require("resty.redis")
local next = next

function make_redis(close_on_shutdown)
	local database, err = resty_redis:new()
	if not database then
		error("Error initializing DB: " .. err)
	end
	database:set_timeout(60000)

	local ok, err = database:connect(CONFIG.redis.host, CONFIG.redis.port)
	if not ok then
		error("Error connecting to DB: " .. err)
	end

	if database:get_reused_times() == 0 and CONFIG.redis.password then
		local ok, err = database:auth(CONFIG.redis.password)
		if not ok then
			error("Error connecting to DB: " .. err)
		end
	end

	database.hgetall_real = database.hgetall
	function database:hgetall(key)
		local res = self:hgetall_real(key)
		if (not res) or (res == ngx.null) then
			return res
		end
		local ret = {}
		local k = nil
		for _,v in next, res do
			if not k then
				k = v
			else
				ret[k] = v
				k = nil
			end
		end
		return ret
	end

	database.hmget_real = database.hmget
	function database:hmget(key, ...)
		local res = self:hmget_real(key, ...)
		if (not res) or (res == ngx.null) then
			return res
		end
		local ret = {}
		local tbl = {...}
		for i,v in next, tbl do
			ret[v] = res[i]
		end
		return ret
	end

	if close_on_shutdown then
		register_shutdown(function() database:close() end)
	else
		register_shutdown(function() database:set_keepalive(CONFIG.redis.keepalive_timeout or 10000, CONFIG.redis.keepalive_count or 10) end)
	end

	return database
end

function get_ctx_redis()
	local redis = ngx.ctx.__redis
	if redis then
		return redis
	end
	redis = make_redis()
	ngx.ctx.__redis = redis
	return redis
end
