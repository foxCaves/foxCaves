local env = require("foxcaves.env")

local function load_config_file(name)
    local func = loadfile("/var/www/foxcaves/config/" .. name .. ".lua")
    func = setfenv(func, {})
    return func()
end

return load_config_file(env.name)
