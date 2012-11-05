lfs.chdir("/var/www/foxcaves/")

ngx.ctx.req_starttime = socket.gettime()

local mysql = require("resty.mysql")

local database, err = mysql:new()
if not database then
	ngx.print("Error initializing MySQL: ", err)
	return ngx.eof()
end
database:set_timeout(60000)

dofile("scripts/dbconfig.lua")
local ok, err = database:connect(dbconfig)
dbconfig = nil

if not ok then
	ngx.print("Error connecting to MySQL: ", err)
	return ngx.eof()
end

local escapeArray = {
	["\0"] = "\\0",
	["\b"] = "\\b",
	["\n"] = "\\n",
	["\r"] = "\\r",
	["\t"] = "\\t",
	["\x1A"] = "\\Z",
	["\\"] = "\\\\",
--	["%"] = "\\%",
--	["_"] = "\\_",
	["'"] = "\\'",
	['"'] = '\\"'
}
function database:escape(str)
	return str:gsub(".", escapeArray)
end
ngx.ctx.database = database

ngx.ctx.EMAIL_INVALID = -1
ngx.ctx.EMAIL_TAKEN = -2
function ngx.ctx.check_email(email)
	if not ngx.re.match(email, "^[a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\\.[a-zA-Z]{2,4}$", "o") then
		return ngx.ctx.EMAIL_INVALID
	end

	email = database:escape(email)
	local emailcur = database:query("SELECT id FROM users WHERE email = '"..email.."' LIMIT 0,1")
	if emailcur and emailcur[1] then
		return ngx.ctx.EMAIL_TAKEN
	end
	return nil
end

function ngx.ctx.check_username(username)
	if not ngx.re.match(username, "^[a-zA-Z0-9 .,;_-]+$", "o") then
		return ngx.ctx.EMAIL_INVALID
	end

	username = database:escape(username)
	local usernamecur = database:query("SELECT id FROM users WHERE username = '"..username.."' LIMIT 0,1")
	if usernamecur and usernamecur[1] then
		return ngx.ctx.EMAIL_TAKEN
	end
	return nil
end

local sizePostFixes = {" B", " kB", " MB", " GB", " TB", " PB", " EB", " ZB", " YB"}

function ngx.ctx.format_size(size)
	size = tonumber(size)
	local sinc = 1
	while size > 1024 do
		sinc = sinc + 1
		size = size / 1024
		if sinc == 9 then
			break
		end
	end
	return (math.ceil(size * 100) / 100) .. assert(sizePostFixes[sinc], "No suitable postfix for file size")
end

function ngx.ctx.escape_html(str)
	if (not str) or type(str) ~= "string" then
		return str
	end
	str = str:gsub("[&<>]", {
		["&"] = "&amp;",
		["<"] = "&lt;",
		[">"] = "&gt;",
	})
	return str
end

function ngx.ctx.get_post_args(...)
	if not ngx.req.get_body_data() then return nil end
	return ngx.req.get_post_args(...)
end

dofile("scripts/access.lua")
