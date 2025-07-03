local autossl = require('resty.acme.autossl')
local config = require('foxcaves.config')
local utils = require('foxcaves.utils')

local cdn_domain = utils.url_to_domain(config.http.cdn_url)
local app_domain = utils.url_to_domain(config.http.app_url)

local domains = { app_domain, cdn_domain }
if config.http.redirect_www then
    table.insert(domains, 'www.' .. cdn_domain)
    table.insert(domains, 'www.' .. app_domain)
end

local M = {}
require('foxcaves.module_helper').setmodenv()

function M.init()
    autossl.init({
        tos_accepted = true,
        account_key_path = '/etc/letsencrypt/account.key',
        account_email = 'ssl@' .. app_domain,
        domain_whitelist = domains,
        storage_adapter = 'file',
        storage_config = {
            dir = '/etc/letsencrypt/storage',
            shm_name = 'acme',
        },
    })
end

function M.init_worker()
    autossl.init_worker()
end

M.ssl_certificate = autossl.ssl_certificate
M.serve_http_challenge = autossl.serve_http_challenge

return M
