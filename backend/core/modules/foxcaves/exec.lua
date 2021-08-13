local resty_exec = require("resty.exec")

local os = os

local M = {}
setfenv(1, M)

function M.cmd(...)
    local sock = os.tmpname()
    local prog = resty_exec.new(sock)
    local res, err = prog(...)
    os.remove(sock)
    return res, err
end

return M