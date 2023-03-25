local io = io
local table = table
local math = math
local ngx = ngx

local M = {}
require("foxcaves.module_helper").setmodenv()

function M.bytes(len)
    local randomstream = io.open("/dev/urandom", "rb")
    local ret = randomstream:read(len)
    randomstream:close()
    return ret
end

function M.seed()
    local seed_str = M.bytes(4)
    local seed = 0
    for i = 1, 4 do
        seed = 256 * seed + seed_str:byte(i)
    end
    if ngx.worker then
        seed = ngx.now() * 1000 + ngx.worker.pid()
    end
    math.randomseed(seed)
end

local chars = {
    "A","B","C","D","E","F","G","H","I","J","K","L","M","N","O","P","Q","R","S","T","U","V","W","X","Y","Z",
    "a","b","c","d","e","f","g","h","i","j","k","l","m","n","o","p","q","r","s","t","u","v","w","x","y","z",
    "0","1","2","3","4","5","6","7","8","9","_","-"
}
local charcount = #chars
function M.string(len)
    local ret = {}
    for _ = 1, len do
        table.insert(ret, chars[math.random(1, charcount)])
    end
    return table.concat(ret)
end

return M
