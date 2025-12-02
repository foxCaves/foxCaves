lua_code_cache on;
http2 on;

listen 443 ssl;
listen [::]:443 ssl;

listen 444 ssl proxy_protocol;
listen [::]:444 ssl proxy_protocol;

ssl_certificate __FCV_STORAGE_ROOT__/acme/snakeoil.crt;
ssl_certificate_key __FCV_STORAGE_ROOT__/acme/snakeoil.key;
ssl_certificate_by_lua_file __FCV_LUA_ROOT__/nginx_ssl_certificate.lua;

add_header Strict-Transport-Security "max-age=31536000; preload; includeSubDomains" always;
