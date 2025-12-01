add_header X-Content-Type-Options nosniff always;

location = /healthz {
    default_type application/json;
    types { }
    content_by_lua_file __LUA_ROOT__/nginx_run.lua;
}

location = /readyz {
    default_type application/json;
    types { }
    content_by_lua_file __LUA_ROOT__/nginx_run.lua;
}

location = /favicon.ico {
    expires 1h;
    alias __FRONTEND_ROOT__/favicon.ico;
}

location = /security.txt {
    expires 1h;
    alias __FRONTEND_ROOT__/.well-known/security.txt;
}

location /.well-known/ {
    expires 1h;
    root __FRONTEND_ROOT__;
}

location /.well-known/acme-challenge/ {
    default_type text/plain;
    types { }
    content_by_lua_file __LUA_ROOT__/nginx_run.lua;
}
