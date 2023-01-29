resolver local=on;

init_by_lua_file /var/www/foxcaves/lua/nginx_init.lua;
lua_socket_log_errors off;

lua_ssl_trusted_certificate /etc/ssl/certs/ca-certificates.crt;
lua_ssl_verify_depth 10;

set_real_ip_from __UPSTREAM_IPS__;
set_real_ip_from 127.0.0.0/8;
set_real_ip_from unix:;
real_ip_header proxy_protocol;

upstream storage_service {
    server __STORAGE_SERVICE_HOST__:443;
    keepalive 32;
}

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
    set $fcv_proxy_authorization "";
    set $fcv_proxy_url "";
    set $fcv_proxy_host "";
    set $fcv_proxy_x_amz_date "";
    set $fcv_proxy_x_amz_content_sha256 "";

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

    location = /fcv-proxyget {
        internal;

        proxy_set_header host $fcv_proxy_host;
        proxy_set_header authorization $fcv_proxy_authorization;
        proxy_set_header x-amz-date $fcv_proxy_x_amz_date;
        proxy_set_header x-amz-content-sha256 $fcv_proxy_x_amz_content_sha256;

        proxy_http_version 1.1;
        proxy_buffering off;
        proxy_pass https://storage_service$fcv_proxy_url;
        proxy_pass_request_body off;
        proxy_pass_request_headers off;
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
