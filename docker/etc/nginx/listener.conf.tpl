lua_code_cache on;
http2 on;

listen 443 ssl;
listen [::]:443 ssl;

listen 444 ssl proxy_protocol;
listen [::]:444 ssl proxy_protocol;

ssl_certificate /etc/letsencrypt/snakeoil.crt;
ssl_certificate_key /etc/letsencrypt/snakeoil.key;
ssl_certificate_by_lua_file /var/www/foxcaves/lua/nginx_ssl_certificate.lua;

add_header Strict-Transport-Security "max-age=31536000; preload; includeSubDomains" always;
