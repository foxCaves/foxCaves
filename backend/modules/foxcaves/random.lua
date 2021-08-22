local io = io
local table = table

local M = {}
require("foxcaves.module_helper").setmodenv()

local chars = {
	"A","B","C","D","E","F","G","H","I","J","K","L","M","N","O","P","Q","R","S","T","U","V","W","X","Y","Z",
	"a","b","c","d","e","f","g","h","i","j","k","l","m","n","o","p","q","r","s","t","u","v","w","x","y","z",
	"0","1","2","3","4","5","6","7","8","9","_","-"
}
local charcount = #chars
function M.string(len)
	local randomstream = io.open("/dev/urandom", "rb")
	local ret = {}
	for _ = 1, len do
		table.insert(ret, chars[(randomstream:read(1):byte() % charcount) + 1])
	end
	randomstream:close()
	return table.concat(ret)
end

function M.bytes(len)
	local randomstream = io.open("/dev/urandom", "rb")
	local ret = randomstream:read(len)
	randomstream:close()
	return ret
end

return M
