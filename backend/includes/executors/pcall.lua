local utils = require('foxcaves.utils')
local router = require('foxcaves.router')
local pcall = pcall
local ngx = ngx

local M = {}
require('foxcaves.module_helper').setmodenv()

function M.run()
    local isok, err = pcall(router.execute)
    ngx.req.discard_body()
    if not isok then
        ngx.status = 500
        ngx.header['Cache-Control'] = 'no-cache, no-store'
        ngx.log(ngx.ERR, 'Lua error: ' .. err)
    end
    utils.__on_shutdown()
    ngx.eof()
end

return M
