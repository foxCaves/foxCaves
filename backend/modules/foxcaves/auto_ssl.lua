local config = require('foxcaves.config')
local auto_ssl = require('resty.auto-ssl').new()
local url_to_domain = require('foxcaves.utils').url_to_domain
local next = next

local short_domain = url_to_domain(config.http.short_url)
local main_domain = url_to_domain(config.http.main_url)

local allowed_domains = {
    [short_domain] = true,
    [main_domain] = true,
    ['www.' .. short_domain] = true,
    ['www.' .. main_domain] = true,
}

require('foxcaves.module_helper').setmodenv()

auto_ssl:set('dir', '/etc/resty-auto-ssl')
auto_ssl:set('redis', config.redis)

if config.http.auto_ssl then
    for k, v in next, config.http.auto_ssl do
        auto_ssl:set(k, v)
    end
end

auto_ssl:set('hook_server_port', 8999)
auto_ssl:set('allow_domain', function(domain)
    return allowed_domains[domain] or false
end)

return auto_ssl
