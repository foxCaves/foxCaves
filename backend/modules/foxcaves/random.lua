local io = io
local table = table
local next = next
local unpack = unpack

local M = {}
require("foxcaves.module_helper").setmodenv()

function M.chars(len)
	local randomstream = io.open("/dev/urandom", "rb")
	local ret = randomstream:read(len)
	randomstream:close()
	return ret
end

function M.bytes(len)
	local str = M.chars(len)
	return {str:byte(1, len)}
end

local chars = {
	"A","B","C","D","E","F","G","H","I","J","K","L","M","N","O","P","Q","R","S","T","U","V","W","X","Y","Z",
	"a","b","c","d","e","f","g","h","i","j","k","l","m","n","o","p","q","r","s","t","u","v","w","x","y","z",
	"0","1","2","3","4","5","6","7","8","9","_","-"
}
local charcount = #chars
function M.string(len)
	local ret = M.bytes(len)
	for k, v in next, ret do
		ret[k] = chars[(v % charcount) + 1]
	end
	return table.concat(ret)
end

return M
