resolver local=on;

access_log off;
log_not_found off;

init_by_lua_file /var/www/foxcaves/lua/nginx_init.lua;
init_worker_by_lua_file /var/www/foxcaves/lua/nginx_init_worker.lua;
lua_socket_log_errors off;

lua_ssl_trusted_certificate /etc/ssl/certs/ca-certificates.crt;
lua_ssl_verify_depth 10;

lua_shared_dict acme 16m;
lua_shared_dict foxcaves 1m;

__UPSTREAM_IPS__
set_real_ip_from 127.0.0.0/8;
set_real_ip_from unix:;
real_ip_header proxy_protocol;

server {
    listen unix:/run/nginx-lua-api.sock default;
    server_name __APP_DOMAIN__;
    include /etc/nginx/basics.conf;
    include /etc/nginx/csp-app.conf;

    real_ip_header X-Real-IP;

    location /api/v1/ {
        gzip on;

        client_max_body_size 0;
        default_type application/json;
        types { }
        content_by_lua_file /var/www/foxcaves/lua/nginx_run.lua;
    }
}

server {
    include __LISTENER_CONFIG__;
    server_name __APP_DOMAIN__;
    include /etc/nginx/basics.conf;
    include /etc/nginx/csp-app.conf;

    root /var/www/foxcaves/html;
    client_max_body_size 10M;
    client_body_buffer_size 64k;

    location / {
        gzip_static on;

        rewrite ^ /static/index_processed.html break;
    }

    location /view/ {
        gzip on;

        default_type text/html;
        types { }
        content_by_lua_file /var/www/foxcaves/lua/nginx_run.lua;
    }

    location /static/ {
        gzip_static on;

        expires 1h;
    }

    location /api/v1/ {
        gzip on;

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
        proxy_buffering off;

        client_max_body_size 0;
        limit_except POST GET {
            deny all;
        }
        proxy_pass http://unix:/run/nginx-lua-api.sock;

    }
}

server {
    include __LISTENER_CONFIG__;
    server_name __CDN_DOMAIN__;
    include /etc/nginx/basics.conf;
    include /etc/nginx/csp-cdn.conf;

    set $fcv_proxy_host "";
    set $fcv_proxy_uri "";

    add_header Access-Control-Allow-Origin "*" always;
    add_header Access-Control-Allow-Methods "GET, OPTIONS, HEAD" always;
    add_header Access-Control-Allow-Headers "Origin, Accept, Range, Content-Type, If-Modified-Since, CSRF-Token" always;
    add_header Access-Control-Expose-Headers "Content-Type, Content-Length, Content-Range, CSRF-Token" always;

    location = / {
        return 302 __APP_URL__;
    }

    location / {
        rewrite ^ /fcv-cdn/link$uri;
    }

    location /fcv-cdn/ {
        internal;

        gzip on;

        rewrite_by_lua_file /var/www/foxcaves/lua/nginx_run.lua;
    }

    location = /fcv-s3get {
        internal;

        proxy_set_header host $http_host;
        proxy_set_header authorization $http_authorization;
        proxy_set_header range $http_range;
        proxy_set_header x-amz-date $http_x_amz_date;
        proxy_set_header x-amz-content-sha256 $http_x_amz_content_sha256;

        proxy_hide_header strict-transport-security;
        proxy_hide_header x-amz-meta-s3cmd-attrs;
        proxy_hide_header access-control-allow-headers;
        proxy_hide_header access-control-allow-methods;
        proxy_hide_header access-control-allow-origin;
        proxy_hide_header access-control-expose-headers;
        proxy_hide_header pragma;
        proxy_hide_header cache-control;
        proxy_hide_header expires;

        proxy_http_version 1.1;
        proxy_buffering off;
        proxy_pass https://$fcv_proxy_host$fcv_proxy_uri;
        proxy_pass_request_body off;
        proxy_pass_request_headers off;
    }

    location /fcv-rawget/ {
        internal;
        alias /;
    }

    location /f/ {
        rewrite ^ /fcv-cdn/sendfile$uri;
    }

    location /t/ {
        rewrite ^ /fcv-cdn/sendfile$uri;
    }
}
