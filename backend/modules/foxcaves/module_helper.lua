local setfenv = setfenv
local protect_table = protect_table

local M = {}
setfenv(1, protect_table({}, 'MODULE_HELPER_EMPTY'))

function M.make_empty_table(name)
    return protect_table({}, name)
end

local empty_table = M.make_empty_table('MODULE_EMPTY')
function M.setmodenv()
    setfenv(2, empty_table)
end

return M
