-- ROUTE:GET:/api/v1/files
api_ctx_init()
if not ngx.ctx.user then return end

local files = get_ctx_database():query_safe('SELECT * FROM files WHERE "user" = %s', ngx.ctx.user.id)

local results = {}
for _, file in next, files do
	table.insert(results, file_get_public(file))
end
ngx.print(cjson.encode(results))
