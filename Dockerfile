# Frontend build container
FROM node:lts-alpine AS frontend_builder

# Install packages
RUN apk --no-cache add brotli gzip

# Prepare build environment
RUN mkdir /opt/stage
WORKDIR /opt/stage

# Prepare frontend build
COPY frontend/package.json /opt/stage/
COPY frontend/package-lock.json /opt/stage/
RUN npm ci
COPY frontend/ /opt/stage/

# Actually build frontend
ARG GIT_REVISION=UNKNOWN
ENV NODE_ENV=production
RUN npm run build

RUN find /opt/stage/build -type f -print0 > /tmp/files.txt && \
    cat /tmp/files.txt | xargs -0 -n1 gzip -k && \
    cat /tmp/files.txt | xargs -0 -n1 brotli -k

FROM openresty/openresty:alpine-fat AS backend-base

FROM backend-base AS backend-builder

RUN export RESTY_VERSION="$(nginx -V 2>&1 | grep -F 'nginx version' | cut -d: -f2- | cut -d/ -f2-)" \
    && cd /tmp \
    && curl -fSL https://openresty.org/download/openresty-${RESTY_VERSION}.tar.gz -o /tmp/openresty-${RESTY_VERSION}.tar.gz \
    && tar -xzf /tmp/openresty-${RESTY_VERSION}.tar.gz \
    && mv /tmp/openresty-${RESTY_VERSION} /tmp/openresty

RUN apk add --no-cache git zlib-dev pcre-dev openssl-dev libxml2-dev libxslt-dev gd-dev geoip-dev perl-dev

RUN nginx -V 2>&1 | grep -F 'configure argument' | cut -d: -f2- | sed 's~--add-module=[^ ]* ~~g' > /tmp/nginx-configure-args.txt \
    && git clone https://github.com/google/ngx_brotli.git /tmp/ngx_brotli \
    && cd /tmp/ngx_brotli \
    && git reset --hard a71f9312c2deb28875acc7bacfdd5695a111aa53 \
    && git submodule update --recursive --init

RUN cd /tmp/openresty \
    && eval ./configure --with-compat --add-dynamic-module=/tmp/ngx_brotli $(cat /tmp/nginx-configure-args.txt) \
    && make -j$(nproc) \
    && make -j$(nproc) install

# Deployed container
FROM backend-base

# Base variables
ENV ENVIRONMENT=development
ENV AWS_EC2_METADATA_DISABLED=true

# OS packages
RUN apk update && apk add imagemagick git brotli argon2-libs argon2-dev argon2 runuser libuuid openssl openssl-dev ca-certificates libqrencode-tools gd-dev freetype-dev font-opensans

# Lua modules
RUN mkdir -p /usr/local/share/lua/5.1 /usr/local/lib/lua/5.1
RUN opm get openresty/lua-resty-redis openresty/lua-resty-websocket thibaultcha/lua-argon2-ffi GUI/lua-resty-mail openresty/lua-resty-string jkeys089/lua-resty-hmac ledgetech/lua-resty-http
RUN luarocks install luasocket
RUN luarocks install luafilesystem
RUN luarocks install pgmoon
RUN luarocks install lua-resty-uuid
RUN luarocks install lua-resty-acme
RUN luarocks install lpath
RUN luarocks install luaossl
RUN git clone --depth 1 --branch v3.0.0 https://github.com/foxCaves/lua-gd /tmp/lua-gd && cd /tmp/lua-gd && luarocks make *.rockspec && cd /tmp && rm -rf /tmp/lua-gd
RUN git clone --depth 1 --branch v1.0.3 https://github.com/foxCaves/raven-lua.git /tmp/raven-lua && mv /tmp/raven-lua/raven /usr/local/share/lua/5.1/ && rm -rf /tmp/raven-lua
RUN git clone --depth 1 --branch v0.1.8 https://github.com/foxCaves/lua-resty-cookie.git /tmp/lua-resty-cookie && cp -r /tmp/lua-resty-cookie/lib/* /usr/local/share/lua/5.1/ && rm -rf /tmp/lua-resty-cookie
RUN git clone --depth 1 --branch v0.3.1 https://github.com/foxCaves/lua-resty-aws-signature.git /tmp/lua-resty-aws-signature && cp -r /tmp/lua-resty-aws-signature/lib/* /usr/local/share/lua/5.1/ && rm -rf /tmp/lua-resty-aws-signature
RUN git clone --depth 1 --branch 1.3.0 https://github.com/spacewander/lua-resty-base-encoding /tmp/lua-resty-base-encoding && cd /tmp/lua-resty-base-encoding && cp -r ./lib/* /usr/local/share/lua/5.1/ && make && cp -fv librestybaseencoding.so /usr/local/lib/lua/5.1/ && rm -rf /tmp/lua-resty-base-encoding

# Container setup
RUN adduser -u 1337 --disabled-password foxcaves
COPY docker /
COPY docker/etc/nginx/main.conf /usr/local/openresty/nginx/conf/custom.conf

# Copy nginx module(s)
COPY --from=backend-builder /usr/local/openresty/nginx/nginx/modules/ngx_http_brotli_static_module.so /usr/local/openresty/nginx/nginx/modules/ngx_http_brotli_static_module.so
COPY --from=backend-builder /usr/local/openresty/nginx/nginx/modules/ngx_http_brotli_filter_module.so /usr/local/openresty/nginx/nginx/modules/ngx_http_brotli_filter_module.so

# Copy backend
COPY config/testing.lua /var/www/foxcaves/config/testing.lua
COPY config/example.lua /var/www/foxcaves/config/example.lua
COPY backend /var/www/foxcaves/lua

# Copy frontend
COPY --from=frontend_builder /opt/stage/build /var/www/foxcaves/html/static

# Implant version
ARG GIT_REVISION=UNKNOWN
RUN echo "$GIT_REVISION" > /var/www/foxcaves/.revision

# Runtime environment setup
EXPOSE 80 443 8080 8443
ENTRYPOINT ["/entrypoint.sh"]
