# Frontend build container
FROM git.foxden.network/mirror/oci-images/node:lts-alpine AS frontend_builder

# Install packages
RUN apk --no-cache add gzip

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
    cat /tmp/files.txt | xargs -0 -n1 gzip -k

FROM git.foxden.network/mirror/oci-images/openresty/openresty:alpine-fat AS backend-base

FROM backend-base AS backend-builder

RUN export RESTY_VERSION="$(nginx -V 2>&1 | grep -F 'nginx version' | cut -d: -f2- | cut -d/ -f2-)" \
    && cd /tmp \
    && curl -fSL https://openresty.org/download/openresty-${RESTY_VERSION}.tar.gz -o /tmp/openresty-${RESTY_VERSION}.tar.gz \
    && tar -xzf /tmp/openresty-${RESTY_VERSION}.tar.gz \
    && mv /tmp/openresty-${RESTY_VERSION} /tmp/openresty

RUN apk add --no-cache git zlib-dev pcre-dev openssl-dev libxml2-dev libxslt-dev gd-dev geoip-dev perl-dev

# Deployed container
FROM backend-base

# Base variables
ENV ENVIRONMENT=development
ENV AWS_EC2_METADATA_DISABLED=true

# OS packages
RUN apk update && apk add imagemagick git argon2-libs argon2-dev argon2 runuser libuuid openssl openssl-dev ca-certificates libqrencode-tools gd-dev freetype-dev font-opensans

# Lua modules
RUN mkdir -p /usr/local/share/lua/5.1 /usr/local/lib/lua/5.1 && rm /usr/local/openresty/lualib/resty/mysql.lua
RUN opm get openresty/lua-resty-redis openresty/lua-resty-websocket thibaultcha/lua-argon2-ffi GUI/lua-resty-mail openresty/lua-resty-string jkeys089/lua-resty-hmac ledgetech/lua-resty-http
RUN luarocks install luasocket
RUN luarocks install luafilesystem
RUN luarocks install lua-resty-jit-uuid
RUN luarocks install lua-resty-acme
RUN luarocks install lpath
RUN luarocks install luaossl
RUN git clone --depth 1 --branch v3.0.0 https://github.com/foxCaves/lua-gd /tmp/lua-gd && cd /tmp/lua-gd && luarocks make *.rockspec && cd /tmp && rm -rf /tmp/lua-gd
RUN git clone --depth 1 --branch v1.0.3 https://github.com/foxCaves/raven-lua.git /tmp/raven-lua && mv /tmp/raven-lua/raven /usr/local/share/lua/5.1/ && rm -rf /tmp/raven-lua
RUN git clone --depth 1 --branch v0.1.8 https://github.com/foxCaves/lua-resty-cookie.git /tmp/lua-resty-cookie && cp -r /tmp/lua-resty-cookie/lib/* /usr/local/share/lua/5.1/ && rm -rf /tmp/lua-resty-cookie
RUN git clone --depth 1 --branch v0.3.1 https://github.com/foxCaves/lua-resty-aws-signature.git /tmp/lua-resty-aws-signature && cp -r /tmp/lua-resty-aws-signature/lib/* /usr/local/share/lua/5.1/ && rm -rf /tmp/lua-resty-aws-signature
RUN git clone --depth 1 --branch 1.3.0 https://github.com/spacewander/lua-resty-base-encoding /tmp/lua-resty-base-encoding && cd /tmp/lua-resty-base-encoding && cp -r ./lib/* /usr/local/share/lua/5.1/ && make && cp -fv librestybaseencoding.so /usr/local/lib/lua/5.1/ && rm -rf /tmp/lua-resty-base-encoding
RUN git clone --depth 1 --revision 459a2afbf28c745c0bd0a2c48a8cb3d0f1bb7171 https://github.com/foxCaves/lua-resty-mysql /tmp/lua-resty-mysql && cp -r /tmp/lua-resty-mysql/lib/* /usr/local/share/lua/5.1/ && rm -rf /tmp/lua-resty-mysql

# Container setup
RUN adduser -u 1337 --disabled-password foxcaves
COPY nginx /etc/nginx

# Copy backend
COPY config/testing.lua /etc/foxcaves/testing.lua
COPY config/example.lua /etc/foxcaves/example.lua
COPY backend /usr/share/foxcaves/lua
COPY bin/ /bin/

# Copy frontend
COPY --from=frontend_builder /opt/stage/build /usr/share/foxcaves/html

RUN ln -s /usr/local/openresty/bin /usr/local/openresty/nginx/

# Implant environment variables
ARG GIT_REVISION=UNKNOWN
ENV GIT_REVISION=${GIT_REVISION}
ENV FCV_LUA_ROOT=/usr/share/foxcaves/lua
ENV FCV_OPENSSL=/usr
ENV FCV_LUAJIT=/usr/local/openresty/luajit
ENV FCV_FRONTEND_ROOT=/usr/share/foxcaves/html
ENV FCV_NGINX_TEMPLATE_ROOT=/etc/nginx
ENV FCV_NGINX=/usr/local/openresty/nginx
ENV CAPTCHA_FONT=/usr/share/fonts/opensans/OpenSans-Regular.ttf

# Runtime environment setup
EXPOSE 80 443 8080 8443
ENTRYPOINT ["/bin/foxcaves", "--skip-env"]
