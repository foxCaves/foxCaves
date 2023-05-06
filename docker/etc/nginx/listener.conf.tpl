lua_code_cache on;

listen 443 ssl http2;
listen [::]:443 ssl http2;

listen 8443 ssl http2 proxy_protocol;
listen [::]:8443 ssl http2 proxy_protocol;

ssl_certificate_by_lua_block {
    require('foxcaves.auto_ssl'):ssl_certificate()
}

ssl_certificate /etc/ssl/snakeoil.crt;
ssl_certificate_key /etc/ssl/snakeoil.key;

add_header Strict-Transport-Security "max-age=31536000; preload; includeSubDomains" always;