dofile(ngx.var.main_root.."/scripts/global.lua")
dofile("scripts/api_login.lua")
if not ngx.ctx.user then return end

local database = ngx.ctx.database
local files = database:zrevrange(database.KEYS.USER_FILES..ngx.ctx.user.id, 0, -1)

if ngx.var.query_string == "idonly" then
	ngx.print(table.concat(files, "\n").."\n")
else
	dofile("scripts/fileapi.lua")
	for _,fileid in pairs(files) do
		local row = file_get(fileid)
		ngx.print(fileid..">"..row.name..">"..row.extension..">"..row.size..">"..row.thumbnail..">"..row.type.."\n")
	end
end
ngx.eof()
