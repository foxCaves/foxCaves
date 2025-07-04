local env = require('foxcaves.env')
local consts = require('foxcaves.consts')

if env.id == consts.ENV_TESTING or env.id == consts.ENV_DEVELOPMENT then
    ngx.log(ngx.WARN, 'Using debug executor')
    return require('foxcaves.executors.debug')
end

return require('foxcaves.executors.production')
