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
ENV AWS_EC2_METADATA_DISABLED=true

RUN apk update && apk add s6 imagemagick git argon2-libs argon2-dev argon2 runuser libuuid openssl openssl-dev certbot certbot-nginx ca-certificates
RUN mkdir -p /usr/local/share/lua/5.1
RUN opm get openresty/lua-resty-redis openresty/lua-resty-websocket thibaultcha/lua-argon2-ffi GUI/lua-resty-mail openresty/lua-resty-string jkeys089/lua-resty-hmac ledgetech/lua-resty-http

RUN luarocks install luasocket
RUN luarocks install luafilesystem
RUN luarocks install pgmoon
RUN luarocks install lua-resty-uuid
RUN luarocks install lpath
RUN luarocks install luaossl
RUN git clone --depth 1 --branch v1.0.1 https://github.com/foxCaves/raven-lua.git /tmp/raven-lua && mv /tmp/raven-lua/raven /usr/local/share/lua/5.1/ && rm -rf /tmp/raven-lua
RUN git clone --depth 1 --branch v0.1.2 https://github.com/foxCaves/lua-resty-cookie.git /tmp/lua-resty-cookie && cp -r /tmp/lua-resty-cookie/lib/* /usr/local/share/lua/5.1/ && rm -rf /tmp/lua-resty-cookie
RUN git clone --depth 1 --branch v0.3.0 https://github.com/foxCaves/lua-resty-aws-signature.git /tmp/lua-resty-aws-signature && cp -r /tmp/lua-resty-aws-signature/lib/* /usr/local/share/lua/5.1/ && rm -rf /tmp/lua-resty-aws-signature

RUN adduser -u 1337 --disabled-password foxcaves

COPY docker /

COPY docker/etc/nginx/main.conf /usr/local/openresty/nginx/conf/custom.conf

COPY backend /var/www/foxcaves/lua
COPY --from=frontend_builder /opt/stage/build /var/www/foxcaves/html/static

ARG GIT_REVISION=UNKNOWN
RUN echo $GIT_REVISION > /var/www/foxcaves/.revision

VOLUME /etc/letsencrypt
VOLUME /var/www/foxcaves/storage
VOLUME /var/www/foxcaves/config

EXPOSE 80 443
ENTRYPOINT ["s6-svscan", "/etc/s6"]
