FROM node:lts-alpine AS frontend_builder

RUN mkdir /opt/stage
WORKDIR /opt/stage
COPY frontend/package.json /opt/stage/
COPY frontend/package-lock.json /opt/stage/
RUN npm ci
COPY frontend/ /opt/stage/

ARG REACT_APP_SENTRY_DSN=''
RUN npm run build



FROM openresty/openresty:alpine-fat

ENV ENVIRONMENT=development

RUN apk update && apk add s6 imagemagick git argon2-libs argon2-dev argon2 runuser libuuid openssl-dev certbot certbot-nginx
RUN mkdir -p /usr/local/share/lua/5.1
RUN /usr/local/openresty/bin/opm get openresty/lua-resty-redis openresty/lua-resty-websocket thibaultcha/lua-argon2-ffi GUI/lua-resty-mail
RUN /usr/local/openresty/luajit/bin/luarocks install luasocket
RUN /usr/local/openresty/luajit/bin/luarocks install luafilesystem
RUN /usr/local/openresty/luajit/bin/luarocks install pgmoon
RUN /usr/local/openresty/luajit/bin/luarocks install lua-resty-uuid
RUN /usr/local/openresty/luajit/bin/luarocks install lpath
RUN /usr/local/openresty/luajit/bin/luarocks install luaossl
RUN git clone --depth 1 --branch v1.0.1 https://github.com/foxCaves/raven-lua.git /tmp/raven-lua && mv /tmp/raven-lua/raven /usr/local/share/lua/5.1/ && rm -rf /tmp/raven-lua
RUN git clone --depth 1 --branch v0.1.2 https://github.com/foxCaves/lua-resty-cookie.git /tmp/lua-resty-cookie && cp -r /tmp/lua-resty-cookie/lib/* /usr/local/share/lua/5.1/ && rm -rf /tmp/lua-resty-cookie
RUN adduser -u 1337 --disabled-password foxcaves

COPY docker /

COPY docker/etc/nginx/main.conf /usr/local/openresty/nginx/conf/custom.conf

COPY backend /var/www/foxcaves/lua
COPY --from=frontend_builder /opt/stage/build /var/www/foxcaves/html

ARG GIT_REVISION=UNKNOWN
RUN echo $GIT_REVISION > /var/www/foxcaves/.revision

VOLUME /etc/letsencrypt
VOLUME /var/www/foxcaves/storage
VOLUME /var/www/foxcaves/config

EXPOSE 80 443
ENTRYPOINT ["s6-svscan", "/etc/s6"]
