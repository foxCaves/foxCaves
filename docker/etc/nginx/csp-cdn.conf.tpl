add_header Content-Security-Policy "default-src 'none'; style-src 'self' __PROTO__ data:; img-src 'self' __PROTO__ data:; media-src 'self' __PROTO__ data:; frame-ancestors __APP_DOMAIN__" always;
