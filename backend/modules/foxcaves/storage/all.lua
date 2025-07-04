local all_config = require('foxcaves.config').storage.backends
local driver_map = {}

for key, config in pairs(all_config) do
    driver_map[key] = require('foxcaves.storage.' .. config.driver).new(key, config)
end

return driver_map
