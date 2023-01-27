server {
    include __LISTENER_CONFIG__;
    server_name www.__SHORT_DOMAIN__ www.__MAIN_DOMAIN__;

    location / {
        return 302 __MAIN_URL__;
    }
}
