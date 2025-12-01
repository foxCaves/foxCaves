local env = require('foxcaves.env')
local FCV_CONFIG_ROOT = require('foxcaves.consts').FCV_CONFIG_ROOT

local function load_config_file(name)
    local func, err = loadfile(FCV_CONFIG_ROOT .. '/' .. name .. '.lua')
    if not func then
        error('Failed loding config: ' .. err)
    end
    func = setfenv(func, {
        os = { getenv = os.getenv },
        tostring = tostring,
        tonumber = tonumber,
    })
    return func()
end

return load_config_file(env.name)
