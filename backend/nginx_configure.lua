local path = require("path")
local root = path.abs(debug.getinfo(1, "S").source:sub(2):match("(.*/)"))
dofile(root .. "/init.lua")

local config = require("foxcaves.config")

local function url_to_domain(url)
    return url:gsub("^https?://", ""):gsub(":.*$", "")
end

local short_domain = url_to_domain(config.http.short_url)
local main_domain = url_to_domain(config.http.main_url)
local upstream_ips_str = table.concat(config.http.upstream_ips, " ")
local listener_config = "/etc/nginx/listener.conf"

local nginx_configs = {
    "/etc/nginx/conf.d/foxcaves.conf",
    "/etc/nginx/conf.d/http-foxcaves.conf",
    "/etc/nginx/listener.conf"
}
local domains = {short_domain, main_domain}

if config.http.force_plaintext then
    listener_config = "/etc/nginx/listener-plaintext.conf"
    table.insert(nginx_configs, "/etc/nginx/listener-plaintext.conf")
end

if config.http.redirect_www then
    table.insert(nginx_configs, "/etc/nginx/conf.d/www-foxcaves.conf")

    table.insert(domains, "www." .. short_domain)
    table.insert(domains, "www." .. main_domain)
end


for _, nginx_config in pairs(nginx_configs) do
    local fh = io.open(nginx_config .. ".tpl", "r")
    local data = fh:read("*a")
    fh:close()

    data = data:gsub("__MAIN_URL__", config.http.main_url)
    data = data:gsub("__MAIN_DOMAIN__", main_domain)
    data = data:gsub("__SHORT_URL__", config.http.short_url)
    data = data:gsub("__SHORT_DOMAIN__", short_domain)
    data = data:gsub("__UPSTREAM_IPS__", upstream_ips_str)
    data = data:gsub("__LISTENER_CONFIG__", listener_config)
    data = data:gsub("__STORAGE_SERVICE_HOST__", config.storage.host or "s3.amazonaws.com")

    fh = io.open(nginx_config, "w")
    fh:write(data)
    fh:close()
end

if config.http.enable_acme and not path.exists("/etc/letsencrypt/live/" .. main_domain .. "/fullchain.pem") then
    local cmd = "certbot --standalone certonly"
    for _, domain in pairs(domains) do
        cmd = cmd .. " -d " .. domain
    end
    os.execute(cmd)
end
