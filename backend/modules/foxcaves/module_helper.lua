local setfenv = setfenv
local error = error

local M = {}

M.EMPTY_TABLE = setmetatable({}, {
    __index = function(_, k)
        error("Accessing on EMPTY table: " .. k)
    end,
    __newindex = function(_, k)
        error("Assigning on EMPTY table: " .. k)
    end,
})

function M.setmodenv()
    setfenv(2, M.EMPTY_TABLE)
end

return M
