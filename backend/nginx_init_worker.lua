require('foxcaves.registry').autoload()

local hooks = require('foxcaves.hooks')
hooks.call('ngx_init_worker')
if ngx.worker.id() == 0 then
    hooks.call('ngx_init_single_worker')
end
