dofile("/var/www/foxcaves/scripts/dbconfig.lua")
dofile("/var/www/foxcaves/scripts/dbconfig_mysql.lua")

local function print(...)
	for k,v in pairs({...}) do
		ngx.print(tostring(v).." ")
	end
	ngx.print("\n")
end

local redis = require("resty.redis")
local mysql = require("resty.mysql")

local db_redis = redis:new()
local db_mysql = mysql:new()

local res, err = db_redis:connect(dbsocket)
db_redis:auth(dbpass)
print(err)

local res, err = db_mysql:connect(dbconfig)
print(err)

for k,v in pairs(db_redis:keys("*")) do
	db_redis:del(v)
	print("DEL:",v)
end

local maxuid = 0
res = db_mysql:query("SELECT * FROM users")
for _,row in pairs(res) do
	local id = tonumber(row.id)
	if id > maxuid then maxuid = id end
	row.id = nil
	row.totalbytes = nil
	db_redis:set(dbkeys.USERNAME_TO_ID..row.username:lower(), id)
	db_redis:sadd(dbkeys.EMAILS, row.email:lower())
	db_redis:hmset(dbkeys.USERS..id, row)
end
db_redis:set(dbkeys.NEXTUSERID, maxuid)
print("Max UID: ", maxuid)

res = db_mysql:query("SELECT * FROM files")
for _,row in pairs(res) do
	local fileid = row.fileid
	row.fileid = nil
	db_redis:zadd(dbkeys.USER_FILES..row.user, tonumber(row.time), fileid)
	db_redis:hmset(dbkeys.FILES..fileid, row)
end

res = db_mysql:query("SELECT * FROM usedinvoices")
for _,row in pairs(res) do
	print(db_redis:sadd(dbkeys.USEDINVOICES, row.invoiceid))
end

print("DONE")
ngx.eof()
