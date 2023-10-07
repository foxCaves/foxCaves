server {
    listen 80 default;
    listen [::]:80 default;

    listen 8080 default proxy_protocol;
    listen [::]:8080 default proxy_protocol;

    server_name _;
    include /etc/nginx/headers.conf;

    location / {
        return 302 https://$host;
    }

    location /.well-known {
        expires 1h;
        root /var/www/foxcaves/html/static;
    }
}
