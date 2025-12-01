local root = os.getenv('LUA_ROOT')
dofile(root .. '/includes/init.lua')
dofile(root .. '/includes/autoloader.lua')

local hooks = require('foxcaves.hooks')
local env = require('foxcaves.env')
local ngx = ngx
local tostring = tostring

local executor_name = require('foxcaves.config').app.executor
ngx.log(ngx.NOTICE, 'Using executor: ', executor_name)
local executor_table = require('foxcaves.module_helper').make_empty_table('EXECUTOR')

local executor = dofile(root .. '/includes/executors/' .. executor_name .. '.lua')
setfenv(executor, executor_table)

local function executor_wrapper()
    local isok, err, err_out = executor()
    ngx.req.discard_body()
    if not isok then
        ngx.log(ngx.ERR, 'Lua error: ' .. tostring(err))

        ngx.status = 500
        ngx.header['Cache-Control'] = 'no-cache, no-store'
        if env.is_debug then
            if not ngx.header['Content-Type'] then
                ngx.header['Content-Type'] = 'text/plain'
            end
            ngx.print(err_out or err)
        end
    end
    hooks.call('context_end')
    ngx.eof()
end
setfenv(executor_wrapper, executor_table)

rawset(_G, 'foxcaves_executor', executor_wrapper)

hooks.call('ngx_init')
