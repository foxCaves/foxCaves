server {
    include /etc/nginx/listener.conf;

    server_name www.__SHORT_DOMAIN__ www.__MAIN_DOMAIN__;

    location / {
        return 302 __MAIN_URL__;
    }
}
