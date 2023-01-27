server {
    listen 80 default;
    listen [::]:80 default;
    server_name _;

    location / {
        return 302 https://$host;
    }
}
