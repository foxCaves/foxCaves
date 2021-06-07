FROM node:current AS builder

RUN mkdir /opt/stage
WORKDIR /opt/stage
COPY Gruntfile.js /opt/stage/
COPY package.json /opt/stage/
COPY package-lock.json /opt/stage/
COPY static /opt/stage/static
RUN npm ci && npm run build

FROM openresty/openresty:alpine-fat

RUN apk update && apk add redis s6 imagemagick git
RUN /usr/local/openresty/bin/opm get openresty/lua-resty-redis openresty/lua-resty-websocket
RUN /usr/local/openresty/luajit/bin/luarocks install luafilesystem
RUN mkdir -p /usr/local/share/lua/5.1
RUN git clone https://github.com/cloudflare/raven-lua.git /tmp/raven-lua && mv /tmp/raven-lua/raven /usr/local/share/lua/5.1/ && rm -rf /tmp/raven-lua
RUN adduser --disabled-password www-data

ARG BUILD_ENV=dev

COPY etc/cfips.sh /etc/nginx/cfips.sh
COPY etc/nginx.conf /etc/nginx/conf.d/foxcaves.conf
COPY etc/nginx.listener.$BUILD_ENV.conf /etc/nginx/listener.conf
COPY etc/s6 /etc/s6

COPY cdn /var/www/foxcaves/cdn
COPY corelua /var/www/foxcaves/corelua
COPY pages /var/www/foxcaves/pages
COPY scripts /var/www/foxcaves/scripts
COPY templates /var/www/foxcaves/templates

COPY html /var/www/foxcaves/html
COPY static /var/www/foxcaves/html/static
COPY --from=builder /opt/stage/diststatic /var/www/foxcaves/html/static

ARG GIT_REVISION=UNKNOWN
RUN echo $GIT_REVISION > /var/www/foxcaves/.revision
RUN /etc/nginx/cfips.sh

EXPOSE 80 443

VOLUME /var/lib/redis
VOLUME /opt/foxcaves_storage
VOLUME /opt/foxcaves_config

ENTRYPOINT ["s6-svscan", "/etc/s6"]
