local path = require('path')
local root = path.abs(debug.getinfo(1, 'S').source:sub(2):match('(.*/)'))
dofile(root .. '/includes/init.lua')

dofile(root .. '/includes/autoloader.lua')

local ngx = ngx
local hooks = require('foxcaves.hooks')

local executor_name = require('foxcaves.config').app.executor
ngx.log(ngx.NOTICE, 'Using executor: ', executor_name)
local executor_table = require('foxcaves.module_helper').make_empty_table('EXECUTOR')

local executor = dofile(root .. '/includes/executors/' .. executor_name .. '.lua')
setfenv(executor, executor_table)

local function executor_wrapper()
    local isok, err, err_out = executor()
    ngx.req.discard_body()
    if not isok then
        ngx.status = 500
        ngx.header['Cache-Control'] = 'no-cache, no-store'
        ngx.header['Content-Type'] = 'text/html'
        if err_out then
            ngx.print(err_out)
        end
        ngx.log(ngx.ERR, 'Lua error: ' .. err)
    end
    hooks.call('request_end')
    ngx.eof()
end
setfenv(executor_wrapper, executor_table)

rawset(_G, 'foxcaves_executor', executor_wrapper)

hooks.call('ngx_init')
