local config = require('foxcaves.config').email
local resty_mail = require('resty.mail').new(config)
local error = error

local M = {}
require('foxcaves.module_helper').setmodenv()

function M.send(user, subject, content)
    local ok, err = resty_mail:send({
        from = config.from,
        to = { user.email },
        subject = 'foxCaves - ' .. subject,
        text = 'Greetings, ' .. user.username .. '!\n\n' .. content .. '\n\nKind regards,\nfoxCaves Support',
    })

    if not ok then
        error('Failed to send E-Mail: ' .. err)
    end
end

return M