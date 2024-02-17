server {
    include __LISTENER_CONFIG__;
    server_name www.__MAIN_DOMAIN__;
    include /etc/nginx/basics.conf;
    include /etc/nginx/csp-main.conf;

    location / {
        return 302 __MAIN_URL__;
    }
}

server {
    include __LISTENER_CONFIG__;
    server_name www.__SHORT_DOMAIN__;
    include /etc/nginx/basics.conf;
    include /etc/nginx/csp-short.conf;

    location / {
        return 302 __MAIN_URL__;
    }
}
