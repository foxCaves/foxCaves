dofile("/var/www/doripush/scripts/global.lua")
dofile("scripts/api_login.lua")
if not ngx.ctx.user then return end

if ngx.var.query_string == "idonly" then
	local res = ngx.ctx.database:query("SELECT fileid FROM files WHERE user = '"..ngx.ctx.user.id.."' ORDER BY time DESC;")
	for _,row in pairs(res) do
		ngx.print(row.fileid.."\n")
	end
else
	local res = ngx.ctx.database:query("SELECT name, extension, fileid, size, thumbnail, type FROM files WHERE user = '"..ngx.ctx.user.id.."' ORDER BY time DESC;")
	for _,row in pairs(res) do
		ngx.print(row.fileid..">"..row.name..">"..row.extension..">"..row.size..">"..row.thumbnail..">"..row.type.."\n")
	end
end
ngx.eof()
