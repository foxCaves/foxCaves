local env = require("foxcaves.env")
local CONFIG_ROOT = require("path").abs(require("foxcaves.consts").ROOT  .. "/config")

local function load_config_file(name)
    local func = loadfile(CONFIG_ROOT .. "/" .. name .. ".lua")
    func = setfenv(func, {})
    return func()
end

return load_config_file(env.name)
