local hooks = require('foxcaves.hooks')
local router = require('foxcaves.router')
local pcall = pcall
local ngx = ngx

return function()
    local isok, err = pcall(router.execute)
    ngx.req.discard_body()
    if not isok then
        ngx.status = 500
        ngx.header['Cache-Control'] = 'no-cache, no-store'
        ngx.log(ngx.ERR, 'Lua error: ' .. err)
    end
    hooks.call('shutdown')
    ngx.eof()
end
