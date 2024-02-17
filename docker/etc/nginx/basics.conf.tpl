add_header X-Content-Type-Options nosniff always;
add_header Content-Security-Policy "default-src 'self' __MAIN_DOMAIN__; img-src 'self' __MAIN_DOMAIN__ __SHORT_DOMAIN__; media-src 'self' __MAIN_DOMAIN__ __SHORT_DOMAIN__; frame-src 'self' __MAIN_DOMAIN__ __SHORT_DOMAIN__" always;

location = /favicon.ico {
    expires 1h;
    alias /var/www/foxcaves/html/static/favicon.ico;
}

location = /security.txt {
    expires 1h;
    alias /var/www/foxcaves/html/static/.well-known/security.txt;
}

location /.well-known {
    expires 1h;
    root /var/www/foxcaves/html/static;
}
