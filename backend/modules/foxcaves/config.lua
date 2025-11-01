local env = require('foxcaves.env')
local CONFIG_ROOT = require('path').abs(require('foxcaves.consts').ROOT .. '/config')

local config_env = { os = { getenv = os.getenv } }

local function load_config_file(name)
    local func, err = loadfile(CONFIG_ROOT .. '/' .. name .. '.lua')
    if not func then
        error('Failed loding config: ' .. err)
    end
    func = setfenv(func, config_env)
    return func()
end

return load_config_file(env.name)
