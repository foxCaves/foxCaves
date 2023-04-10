local setfenv = setfenv

local M = {}

M.EMPTY_TABLE = protect_table({}, 'EMPTY')

function M.setmodenv()
    setfenv(2, M.EMPTY_TABLE)
end

return M
