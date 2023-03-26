local setfenv = setfenv

local M = {}

M.EMPTY_TABLE = protect_table({})

function M.setmodenv()
    setfenv(2, M.EMPTY_TABLE)
end

return M
