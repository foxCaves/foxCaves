lua_code_cache on;
http2 on;

listen 443 ssl;
listen [::]:443 ssl;

listen 444 ssl proxy_protocol;
listen [::]:444 ssl proxy_protocol;

add_header Strict-Transport-Security "max-age=31536000; preload; includeSubDomains" always;
