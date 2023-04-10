local all_config = require('foxcaves.config').storage
local driver_map = {}

for key, config in pairs(all_config) do
    if key ~= 'default' then
        driver_map[key] = require('foxcaves.storage.' .. config.driver).new(key, config)
    end
end

return driver_map
