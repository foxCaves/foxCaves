lfs.chdir(ngx.var.main_root)
dofile("/var/www/foxcaves/config/main.lua")

ngx.ctx.user = nil

local redis = require("resty.redis")
local argon2 = require("argon2")

function make_database()
	local database, err = redis:new()
	if not database then
		ngx.print("Error initializing DB: ", err)
		return ngx.eof()
	end
	database:set_timeout(60000)

	dofile("/var/www/foxcaves/config/database.lua")
	local ok, err = database:connect(dbip, dbport)
	if not ok then
		ngx.print("Error connecting to DB: ", err)
		return ngx.eof()
	end

	if database:get_reused_times() == 0 and dbpass then
		local ok, err = database:auth(dbpass)
		if not ok then
			ngx.print("Error connecting to DB: ", err)
			return ngx.eof()
		end
	end

	database.KEYS =  {
		USERS = "users:",
		USERNAME_TO_ID = "username_to_id:",
		USEDINVOICES = "used_invoices:",
		SESSIONS = "sessions:",
		NEXTUSERID = "next_user_id:",
		PUSH = "push:",
		LIVEDRAW = "livedraw:",

		FILES = "files:",
		USER_FILES = "user_files:",

		EMAILS = "emails:",
		EMAILKEYS = "email_keys:",

		LINKS = "links:",
		USER_LINKS = "user_links:",
	}
	dbip = nil
	dbport = nil
	dbpass = nil

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

	return database
end

ngx.ctx.database = make_database()
ngx.ctx.make_database = make_database
local database = ngx.ctx.database

ngx.ctx.EMAIL_INVALID = -1
ngx.ctx.EMAIL_TAKEN = -2
function ngx.ctx.check_email(email)
	if not ngx.re.match(email, "^[a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\\.[a-zA-Z]{2,}$", "o") then
		return ngx.ctx.EMAIL_INVALID
	end

	local res = database:sismember(database.KEYS.EMAILS, email:lower())
	if res and res ~= 0 and res ~= ngx.null then
		return ngx.ctx.EMAIL_TAKEN
	end
	return nil
end

function ngx.ctx.check_username(username)
	if not ngx.re.match(username, "^[a-zA-Z0-9 .,;_-]+$", "o") then
		return ngx.ctx.EMAIL_INVALID
	end

	local res = database:exists(database.KEYS.USERS .. username:lower())
	if res and res ~= 0 and res ~= ngx.null then
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

function ngx.ctx.get_version()
	local fh = io.open(".revision", "r")
	if not fh then
		return "UNKNOWN"
	end
	local ret = fh:read("*all")
	fh:close()
	return ret:gsub("%s+", "")
end

function raw_push_action(data, user)
	if not user then
		user = ngx.ctx.user
	end
	database:publish(database.KEYS.PUSH .. user.id, cjson.encode(data))
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
