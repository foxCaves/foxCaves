local config = require("foxcaves.config").storage
local driver_map = {}

for key, config in pairs(config) do
    if key ~= "default" then
        driver_map[key] = require("foxcaves.storage." .. config.driver).new(config)
    end
end

return driver_map
