-- ROUTE:GET:/api/v1/links
api_ctx_init()
if not ngx.ctx.user then return end

local links = ngx.ctx.database:query_safe('SELECT * FROM links WHERE "user" = %s', ngx.ctx.user.id)

local results = {}
for _, link in next, links do
	table.insert(results, link_get(link))
end
ngx.print(cjson.encode(results))
