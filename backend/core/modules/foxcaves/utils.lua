local cjson = require("cjson")
local ngx = ngx
local table = table
local type = type
local next = next

module("utils")

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
		v()
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
