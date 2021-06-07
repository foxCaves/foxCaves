FROM openresty/openresty:alpine-fat

RUN apk update && apk add redis s6
RUN /usr/local/openresty/bin/opm get openresty/lua-resty-redis openresty/lua-resty-websocket
RUN /usr/local/openresty/luajit/bin/luarocks install luafilesystem

COPY etc/nginx.conf /etc/nginx/conf.d/foxcaves.conf
COPY etc/s6 /etc/s6

COPY . /var/www/foxcaves

EXPOSE 80 443

VOLUME /var/lib/redis
VOLUME /var/www/foxcaves/files
VOLUME /var/www/foxcaves/thumbs
VOLUME /var/www/foxcaves/config

ENTRYPOINT ["s6-svscan", "/etc/s6"]
