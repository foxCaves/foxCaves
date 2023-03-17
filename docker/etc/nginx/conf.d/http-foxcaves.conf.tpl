server {
    listen 80 default;
    listen [::]:80 default;

    listen 8080 default proxy_protocol;
    listen [::]:8080 default proxy_protocol;

    server_name _;

    location / {
        return 302 https://$host;
    }
}
