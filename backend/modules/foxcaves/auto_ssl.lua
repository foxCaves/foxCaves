local config = require('foxcaves.config')
local auto_ssl = require('resty.auto-ssl').new()
local url_to_domain = require('foxcaves.utils').url_to_domain

local short_domain = url_to_domain(config.http.short_url)
local main_domain = url_to_domain(config.http.main_url)

local allowed_domains = {
    [short_domain] = true,
    [main_domain] = true,
    ['www.' .. short_domain] = true,
    ['www.' .. main_domain] = true,
}

require('foxcaves.module_helper').setmodenv()

auto_ssl:set('allow_domain', function(domain)
    return allowed_domains[domain] or false
end)

return auto_ssl
