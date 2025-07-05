local consts = require('foxcaves.consts')

local envtbl = {
    production = consts.ENV_PRODUCTION,
    development = consts.ENV_DEVELOPMENT,
    testing = consts.ENV_TESTING,
    staging = consts.ENV_STAGING,
}
local str = OSENV.ENVIRONMENT:lower()
local id = envtbl[str]
if not id then
    error('Invalid environment: ' .. str)
end

return {
    id = id,
    name = str,
    is_debug = id == consts.ENV_DEVELOPMENT or id == consts.ENV_TESTING,
}
