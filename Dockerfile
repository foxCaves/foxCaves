FROM openresty/openresty:alpine-fat

RUN apk update && apk add redis s6
RUN /usr/local/openresty/bin/opm get openresty/lua-resty-redis openresty/lua-resty-websocket
RUN /usr/local/openresty/luajit/bin/luarocks install luafilesystem

COPY etc/nginx.conf /etc/nginx/conf.d/foxcaves.conf
COPY etc/s6 /etc/s6

COPY cdn /var/www/foxcaves/cdn
COPY corelua /var/www/foxcaves/corelua
COPY pages /var/www/foxcaves/pages
COPY scripts /var/www/foxcaves/scripts
COPY templates /var/www/foxcaves/templates

COPY html /var/www/foxcaves/html
COPY static /var/www/foxcaves/html/static
COPY diststatic /var/www/foxcaves/html/static

EXPOSE 80 443

VOLUME /var/lib/redis
VOLUME /var/www/foxcaves/uploads
VOLUME /opt/foxcaves_config

ENTRYPOINT ["s6-svscan", "/etc/s6"]
