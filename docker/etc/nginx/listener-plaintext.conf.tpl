lua_code_cache on;

listen 80;
listen [::]:80;

listen 81 proxy_protocol;
listen [::]:81 proxy_protocol;
