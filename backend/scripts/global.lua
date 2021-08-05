lfs.chdir(ngx.var.main_root)
dofile("/var/www/foxcaves/config/main.lua")

dofile("/var/www/foxcaves/config/database.lua")
local dbconfig = _config
_config = nil

ngx.ctx.user = nil

local resty_redis = require("resty.redis")
local pgmoon = require("pgmoon")
local argon2 = require("argon2")

local shutdown_funcs = {}
function register_shutdown(func)
	table.insert(shutdown_funcs, func)
end
function __on_shutdown()
	for _, v in next, shutdown_funcs do
		v()
	end
	shutdown_funcs = {}
end

function make_redis()
	local database, err = resty_redis:new()
	if not database then
		ngx.print("Error initializing DB: ", err)
		return ngx.eof()
	end
	database:set_timeout(60000)

	local ok, err = database:connect(dbconfig.redis.ip, dbconfig.redis.port)
	if not ok then
		ngx.print("Error connecting to DB: ", err)
		return ngx.eof()
	end

	if database:get_reused_times() == 0 and dbconfig.redis.password then
		local ok, err = database:auth(dbconfig.redis.password)
		if not ok then
			ngx.print("Error connecting to DB: ", err)
			return ngx.eof()
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

	register_shutdown(function() database:set_keepalive(dbconfig.redis.keepalive_timeout or 10000, dbconfig.redis.keepalive_count or 100) end)

	return database
end

function make_database()
	local database = pgmoon.new(dbconfig.postgres)
	assert(database:connect())

	function database:query_safe(query, ...)
		local args = {...}
		for i,v in next, args do
			args[i] = database:escape_literal(tostring(v))
		end
		query = query:format(unpack(args))
		local res, err = self:query(query)
		if not res then
			error(err)
		end
		return res
	end

	register_shutdown(function() database:keepalive(dbconfig.postgres.keepalive_timeout or 10000, dbconfig.postgres.keepalive_count or 100) end)

	return database
end

ngx.ctx.make_redis = make_redis
ngx.ctx.redis = make_redis()
local redis = ngx.ctx.redis
ngx.ctx.make_database = make_database
ngx.ctx.database = make_database()
local database = ngx.ctx.database

ngx.ctx.EMAIL_INVALID = -1
ngx.ctx.EMAIL_TAKEN = -2
function ngx.ctx.check_email(email)
	if not ngx.re.match(email, "^[a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\\.[a-zA-Z]{2,}$", "o") then
		return ngx.ctx.EMAIL_INVALID
	end

	local res = database:query_safe('SELECT id FROM users WHERE lower(email) = %s', email:lower())
	if res[1] then
		return ngx.ctx.EMAIL_TAKEN
	end
	return nil
end

function ngx.ctx.check_username(username)
	if not ngx.re.match(username, "^[a-zA-Z0-9 .,;_-]+$", "o") then
		return ngx.ctx.EMAIL_INVALID
	end

	local res = database:query_safe('SELECT id FROM users WHERE lower(username) = %s', username:lower())
	if res[1] then
		return ngx.ctx.EMAIL_TAKEN
	end
	return nil
end

local repTbl = {
	["&"] = "&amp;",
	["<"] = "&lt;",
	[">"] = "&gt;",
}

function ngx.ctx.escape_html(str)
	if (not str) or type(str) ~= "string" then
		return str
	end
	str = str:gsub("[&<>]", repTbl)
	return str
end

function ngx.ctx.get_post_args()
	ngx.req.read_body()
	return ngx.req.get_post_args()
end

function raw_push_action(data, user)
	if not user then
		user = ngx.ctx.user
	end
	redis:publish("push:" .. user.id, cjson.encode(data))
end

function api_not_logged_in_error()
	api_error("Not logged in", 403)
end

function api_error(error, code)
	ngx.req.discard_body()
	ngx.status = code or 400
	ngx.print(cjson.encode({ error = error }))
	return ngx.eof()
end

function printTemplateAndClose(name, params)
	ngx.print(evalTemplate(name, params))
	ngx.eof()
end
function printStaticTemplateAndClose(name, params, cachekey)
	ngx.print(evalTemplateAndCache(name, params, cachekey))
	ngx.eof()
end
dofile("scripts/access.lua")

_G.ngx = ngx
_G.math = math
_G.tonumber = tonumber
_G.tostring = tostring
_G.os = os
_G.lfs = lfs
_G.cjson = cjson
_G.argon2 = argon2
