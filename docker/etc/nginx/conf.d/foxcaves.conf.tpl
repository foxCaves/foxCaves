resolver local=on;
init_by_lua_file /var/www/foxcaves/lua/nginx_init.lua;
lua_socket_log_errors off;

set_real_ip_from 10.99.10.1;
real_ip_header proxy_protocol;

server {
    include /etc/nginx/listener.conf;

    root /var/www/foxcaves/html;

    server_name __MAIN_DOMAIN__ main.foxcaves;

    client_max_body_size 100M;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /static {
        expires 1h;
    }

    location /api/v1 {
        default_type application/json;
        types { }
        content_by_lua_file /var/www/foxcaves/lua/nginx_run.lua;
    }
}

server {
    include /etc/nginx/listener.conf;

    server_name __SHORT_DOMAIN__ short.foxcaves;

    add_header Access-Control-Allow-Origin "*" always;
    add_header Access-Control-Allow-Methods "GET, OPTIONS, HEAD" always;
    add_header Access-Control-Allow-Headers "Origin, Accept, Range, Content-Type, If-Modified-Since" always;
    add_header Access-Control-Expose-Headers "Content-Type, Content-Length, Content-Range" always;

    location = / {
        return 302 __MAIN_URL__;
    }

    location / {
        rewrite ^ /fcv-cdn/link$uri;
    }

    location /fcv-cdn/ {
        internal;
        rewrite_by_lua_file /var/www/foxcaves/lua/nginx_run.lua;
    }

    location /fcv-rawget/ {
        internal;
        alias /var/www/foxcaves/storage/;
    }

    location /f/ {
        rewrite ^ /fcv-cdn/sendfile$uri;
    }

    location /t/ {
        rewrite ^ /fcv-cdn/sendfile$uri;
    }
}

server {
    listen 80 default;
    listen [::]:80 default;

    server_name _;

    location / {
        return 302 https://$host;
    }
}

server {
    include /etc/nginx/listener.conf;

    server_name www.__SHORT_DOMAIN__ www.__MAIN_DOMAIN__;

    location / {
        return 302 __MAIN_URL__;
    }
}
