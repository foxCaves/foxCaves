local router = require('foxcaves.router')
local pcall = pcall

return function()
    local isok, err = pcall(router.execute)
    return isok, err, nil
end
