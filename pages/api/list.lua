dofile("/var/www/doripush/scripts/global.lua")
dofile("scripts/api_login.lua")

local res = ngx.ctx.database:query("SELECT name, extension, fileid, size, thumbnail FROM files WHERE user = '"..ngx.ctx.user.id.."'")
for _,row in pairs(res) do
	ngx.print(row.fileid..">"..row.name..">"..row.extension..">"..row.size..">"..row.thumbnail.."\n")
end
ngx.eof()
