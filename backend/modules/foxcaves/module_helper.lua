local setfenv = setfenv
local protect_table = protect_table

local M = {}
local function make_empty_table(name)
    return protect_table({}, name .. '_EMPTY')
end

setfenv(1, make_empty_table('MODULE_HELPER'))

M.make_empty_table = make_empty_table

local empty_table = make_empty_table('MODULE')
function M.setmodenv()
    setfenv(2, empty_table)
end

return M
