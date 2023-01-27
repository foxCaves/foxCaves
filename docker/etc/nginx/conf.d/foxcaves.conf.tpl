resolver local=on;
init_by_lua_file /var/www/foxcaves/lua/nginx_init.lua;
lua_socket_log_errors off;

set_real_ip_from __UPSTREAM_IPS__;
set_real_ip_from 127.0.0.0/8;
set_real_ip_from unix:;
real_ip_header proxy_protocol;

server {
    listen unix:/run/nginx-lua-http11.sock;
    server_name __MAIN_DOMAIN__;

    client_max_body_size 100M;

    real_ip_header X-Real-IP;

    location /api/v1 {
        default_type application/json;
        types { }
        content_by_lua_file /var/www/foxcaves/lua/nginx_run.lua;
    }
}

server {
    include __LISTENER_CONFIG__;
    server_name __MAIN_DOMAIN__;

    root /var/www/foxcaves/html;
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

    location = /api/v1/files {
        default_type application/json;
        types { }

        proxy_set_header Host $host;
        proxy_http_version 1.1;
        proxy_request_buffering off;

        if ($request_method = POST) {
            proxy_pass http://unix:/run/nginx-lua-http11.sock;
        }
        if ($request_method != POST) {
            content_by_lua_file /var/www/foxcaves/lua/nginx_run.lua;
        }
    }
}

server {
    include __LISTENER_CONFIG__;
    server_name __SHORT_DOMAIN__;

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
