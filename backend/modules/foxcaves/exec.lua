local ngx_pipe = require('ngx.pipe')

local M = {}
require('foxcaves.module_helper').setmodenv()

function M.cmd(...)
    local proc, err = ngx_pipe.spawn({ ... })
    if err or not proc then
        return false, err, -1
    end
    local stdout = proc:stdout_read_all()
    local stderr = proc:stderr_read_all()
    local ok, reason, status = proc:wait()
    return {
        ok = ok,
        reason = reason,
        status = status,
        stdout = stdout,
        stderr = stderr,
    }
end

return M
