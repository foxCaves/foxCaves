server {
    include __LISTENER_CONFIG__;
    server_name www.__APP_DOMAIN__;
    include /etc/nginx/basics.conf;
    include /etc/nginx/csp-app.conf;

    location / {
        return 302 __APP_URL__;
    }
}

server {
    include __LISTENER_CONFIG__;
    server_name www.__CDN_DOMAIN__;
    include /etc/nginx/basics.conf;
    include /etc/nginx/csp-cdn.conf;

    location / {
        return 302 __APP_URL__;
    }
}
