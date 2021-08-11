local cjson = require("cjson")

function register_shutdown(func)
	if not ngx.ctx.shutdown_funcs then
		ngx.ctx.shutdown_funcs = {}
	end
	table.insert(ngx.ctx.shutdown_funcs, func)
end
function __on_shutdown()
	if not ngx.ctx.shutdown_funcs then
		return
	end

	for _, v in next, ngx.ctx.shutdown_funcs do
		local isok, err = pcall(v)
		if not isok then
			ngx.log(ngx.ERR, "Shutdown function failed: " .. err)
		end
	end
	ngx.ctx.shutdown_funcs = nil
end

local repTbl = {
	["&"] = "&amp;",
	["<"] = "&lt;",
	[">"] = "&gt;",
}

function escape_html(str)
	if (not str) or type(str) ~= "string" then
		return str
	end
	str = str:gsub("[&<>]", repTbl)
	return str
end

function get_post_args()
	ngx.req.read_body()
	return ngx.req.get_post_args()
end

function raw_push_action(data, user)
	if user.id then
		user = user.id
	end
	get_ctx_redis():publish("push:" .. user, cjson.encode(data))
end

function api_not_logged_in_error()
	return api_error("Not logged in", 403)
end

function api_error(error, code)
	return { error = error }, (code or 400)
end

function explode(div,str) -- credit: http://richard.warburton.it
	local pos, arr = 0, {}
	-- for each divider found
	for st, sp in function() return str:find(div,pos,true) end do
		table.insert(arr,str:sub(pos,st-1)) -- Attach chars left of current divider
		pos = sp + 1 -- Jump past current divider
	end
	table.insert(arr, str:sub(pos)) -- Attach chars right of last divider
	return arr
end
