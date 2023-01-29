local drivers = {"local", "s3"}
local driver_map = {}

for _, driver in pairs(drivers) do
    driver_map[driver] = require("foxcaves.storage." .. driver)
end

return driver_map
