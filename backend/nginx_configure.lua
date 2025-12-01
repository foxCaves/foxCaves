package.loaded['resty.http'] = {}
package.loaded['resty.aws-signature'] = { new = function()
    return {}
end }
rawset(_G, 'ngx', {
    ctx = {},
    worker = false,
})

dofile(os.getenv('FCV_LUA_ROOT') .. '/includes/init.lua')
local nginx_root = os.getenv('FCV_NGINX_ROOT') or '/etc/nginx'

local config = require('foxcaves.config')
local utils = require('foxcaves.utils')
local htmlgen = require('foxcaves.htmlgen')

local cdn_domain = utils.url_to_domain(config.http.cdn_url)
local app_domain = utils.url_to_domain(config.http.app_url)
local upstream_ips_str = ''
for _, upstream_ip in pairs(config.http.upstream_ips) do
    upstream_ips_str = upstream_ips_str .. 'set_real_ip_from ' .. upstream_ip .. ';\n'
end

local listener_config = nginx_root .. '/listener.conf'

local nginx_configs =
    {
        nginx_root .. '/basics.conf',
        nginx_root .. '/conf.d/foxcaves.conf',
        nginx_root .. '/conf.d/http-foxcaves.conf',
        nginx_root .. '/conf.d/mime.conf',
        nginx_root .. '/csp-app.conf',
        nginx_root .. '/csp-cdn.conf',
        nginx_root .. '/listener.conf',
    }

if config.http.force_plaintext then
    listener_config = nginx_root .. '/listener-plaintext.conf'
    table.insert(nginx_configs, nginx_root .. '/listener-plaintext.conf')
end

if config.http.redirect_www then
    table.insert(nginx_configs, nginx_root .. '/conf.d/www-foxcaves.conf')
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

    data = data:gsub('__FCV_NGINX_ROOT__', nginx_root)
    data = data:gsub('__FCV_LUA_ROOT__', os.getenv('FCV_LUA_ROOT'))
    data = data:gsub('__FCV_FRONTEND_ROOT__', os.getenv('FCV_FRONTEND_ROOT'))
    data = data:gsub('__FCV_NGINX__', os.getenv('FCV_NGINX'))

    fh = io.open(nginx_config, 'w')
    fh:write(data)
    fh:close()
end

local fh = io.open(nginx_root .. '/conf.d/dynamic.conf', 'w')
local storage_map = require('foxcaves.storage.all')
for name, storage in pairs(storage_map) do
    if storage.build_nginx_config then
        fh:write('# Storage config for ' .. name .. '\n')
        fh:write(storage:build_nginx_config())
        fh:write('\n\n')
    end
end
fh:close()

fh = io.open(nginx_root .. '/index_processed.html', 'w')
fh:write(htmlgen.generate_index_html())
fh:close()
