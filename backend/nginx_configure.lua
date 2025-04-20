local os_execute = os.execute

package.loaded['resty.http'] = {}
package.loaded['resty.aws-signature'] = {
    new = function()
        return {}
    end
}
rawset(_G, 'ngx', {
    ctx = {},
    worker = false,
})

local path = require('path')
local root = path.abs(debug.getinfo(1, 'S').source:sub(2):match('(.*/)'))
dofile(root .. '/init.lua')
dofile(root .. '/init_worker.lua')

local config = require('foxcaves.config')
local utils = require('foxcaves.utils')
local htmlgen = require('foxcaves.htmlgen')

local cdn_domain = utils.url_to_domain(config.http.cdn_url)
local app_domain = utils.url_to_domain(config.http.app_url)
local upstream_ips_str = ''
for _, upstream_ip in pairs(config.http.upstream_ips) do
    upstream_ips_str = upstream_ips_str .. 'set_real_ip_from ' .. upstream_ip .. ';\n'
end

local listener_config = '/etc/nginx/listener.conf'

local nginx_configs =
{
    '/etc/nginx/conf.d/foxcaves.conf',
    '/etc/nginx/conf.d/http-foxcaves.conf',
    '/etc/nginx/listener.conf',
    '/etc/nginx/csp-app.conf',
    '/etc/nginx/csp-cdn.conf',
}
local domains = { app_domain, cdn_domain }

if config.http.force_plaintext then
    listener_config = '/etc/nginx/listener-plaintext.conf'
    table.insert(nginx_configs, '/etc/nginx/listener-plaintext.conf')
end

if config.http.redirect_www then
    table.insert(nginx_configs, '/etc/nginx/conf.d/www-foxcaves.conf')

    table.insert(domains, 'www.' .. cdn_domain)
    table.insert(domains, 'www.' .. app_domain)
end

for _, nginx_config in pairs(nginx_configs) do
    local fh = io.open(nginx_config .. '.tpl', 'r')
    local data = fh:read('*a')
    fh:close()

    data = data:gsub('__PROTO__', config.http.force_plaintext and 'http:' or 'https:')
    data = data:gsub('__APP_URL__', config.http.app_url)
    data = data:gsub('__APP_DOMAIN__', app_domain)
    data = data:gsub('__CDN_URL__', config.http.cdn_url)
    data = data:gsub('__CDN_DOMAIN__', cdn_domain)
    data = data:gsub('__UPSTREAM_IPS__', upstream_ips_str)
    data = data:gsub('__LISTENER_CONFIG__', listener_config)

    fh = io.open(nginx_config, 'w')
    fh:write(data)
    fh:close()
end

if config.http.enable_acme and not path.exists('/etc/letsencrypt/live/' .. app_domain .. '/fullchain.pem') then
    local cmd = 'certbot --standalone certonly'
    for _, domain in pairs(domains) do
        cmd = cmd .. ' -d ' .. domain
    end
    os_execute(cmd)
end

local fh = io.open('/etc/nginx/conf.d/dynamic.conf', 'w')
local storage_map = require('foxcaves.storage.all')
for name, storage in pairs(storage_map) do
    if storage.build_nginx_config then
        fh:write('# Storage config for ' .. name .. '\n')
        fh:write(storage:build_nginx_config())
        fh:write('\n\n')
    end
end
fh:close()

fh = io.open(path.abs(LUA_ROOT .. '/../html') .. '/static/index_processed.html', 'w')
fh:write(htmlgen.generate_index_html())
fh:close()
