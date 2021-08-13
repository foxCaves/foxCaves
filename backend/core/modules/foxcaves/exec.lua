local ngx_pipe = require("ngx.pipe")

local M = {}
setfenv(1, M)

function M.cmd(...)
    local proc, err = ngx_pipe.spawn({...})
    if err or not proc then
        return false, err, -1
    end
    return proc:wait()
end

return M
