lua_code_cache on;

listen 443 ssl http2;
listen [::]:443 ssl http2;

listen 8443 ssl http2 proxy_protocol;
listen [::]:8443 ssl http2 proxy_protocol;

ssl_certificate /etc/letsencrypt/live/__MAIN_DOMAIN__/fullchain.pem;
ssl_certificate_key /etc/letsencrypt/live/__MAIN_DOMAIN__/privkey.pem;

add_header Strict-Transport-Security "max-age=31536000; preload; includeSubDomains" always;
