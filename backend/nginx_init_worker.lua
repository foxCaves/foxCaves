require('foxcaves.random').init_worker()
require('foxcaves.acme').init_worker()

if ngx.worker.id() == 0 then
    require('foxcaves.expiry_manager').init_single_worker()
end
