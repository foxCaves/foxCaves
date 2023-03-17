lua_code_cache on;

listen 80;
listen [::]:80;

listen 8080 proxy_protocol;
listen [::]:8080 proxy_protocol;
