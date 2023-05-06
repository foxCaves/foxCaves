server {
    include __LISTENER_CONFIG__;
    server_name www.__SHORT_DOMAIN__ www.__MAIN_DOMAIN__;
    include /etc/nginx/headers.conf;

    location / {
        return 302 __MAIN_URL__;
    }

    location /.well-known {
        expires 1h;
        root /var/www/foxcaves/html/static;
    }
}
