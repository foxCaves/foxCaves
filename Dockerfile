FROM alpine AS builder
RUN apk update && apk add git
WORKDIR /opt/foxcaves
COPY .git /opt/foxcaves/.git
RUN git rev-parse --short HEAD > /opt/foxcaves/.revision

FROM openresty/openresty:alpine-fat

RUN apk update && apk add redis s6 imagemagick
RUN /usr/local/openresty/bin/opm get openresty/lua-resty-redis openresty/lua-resty-websocket
RUN /usr/local/openresty/luajit/bin/luarocks install luafilesystem
RUN adduser --disabled-password www-data

COPY etc/nginx.conf /etc/nginx/conf.d/foxcaves.conf
COPY etc/s6 /etc/s6

COPY cdn /var/www/foxcaves/cdn
COPY corelua /var/www/foxcaves/corelua
COPY pages /var/www/foxcaves/pages
COPY scripts /var/www/foxcaves/scripts
COPY templates /var/www/foxcaves/templates

COPY --from=builder /opt/foxcaves/.revision  /var/www/foxcaves/.revision

COPY html /var/www/foxcaves/html
COPY static /var/www/foxcaves/html/static
COPY diststatic /var/www/foxcaves/html/static

EXPOSE 80 443

VOLUME /var/lib/redis
VOLUME /opt/foxcaves_storage
VOLUME /opt/foxcaves_config

ENTRYPOINT ["s6-svscan", "/etc/s6"]
