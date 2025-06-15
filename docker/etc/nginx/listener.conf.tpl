lua_code_cache on;
http2 on;

listen 443 ssl;
listen [::]:443 ssl;

listen 444 ssl proxy_protocol;
listen [::]:444 ssl proxy_protocol;

ssl_certificate /etc/letsencrypt/live/__APP_DOMAIN__/fullchain.pem;
ssl_certificate_key /etc/letsencrypt/live/__APP_DOMAIN__/privkey.pem;

add_header Strict-Transport-Security "max-age=31536000; preload; includeSubDomains" always;
