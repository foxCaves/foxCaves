require('foxcaves.random').ngx_init_worker()
require('foxcaves.acme').ngx_init_worker()

if ngx.worker.id() == 0 then
    require('foxcaves.expiry_manager').ngx_init_single_worker()
end
