server {
    listen 80 default;
    listen [::]:80 default;

    listen 81 default proxy_protocol;
    listen [::]:81 default proxy_protocol;

    server_name _;
    include basics.conf;
    add_header Content-Security-Policy "default-src 'self'; frame-ancestors 'none'" always;

    location / {
        return 302 https://$host;
    }
}
