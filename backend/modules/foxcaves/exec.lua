local ngx_pipe = require('ngx.pipe')

local M = {}
require('foxcaves.module_helper').setmodenv()

function M.cmd(...)
    local proc, err = ngx_pipe.spawn({ ... })
    if err or not proc then
        return false, err, -1
    end
    return proc:wait()
end

return M
