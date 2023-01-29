local config = require("foxcaves.config").storage

return require("foxcaves.storage." .. config.driver)
