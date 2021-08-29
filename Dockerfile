FROM node:current AS frontend_builder

RUN mkdir /opt/stage
WORKDIR /opt/stage
COPY frontend/package.json /opt/stage/
COPY frontend/package-lock.json /opt/stage/
RUN npm ci
COPY frontend/ /opt/stage/

RUN npm run build



FROM ghcr.io/foxcaves/base-image/alpine:latest

ENV ENVIRONMENT=development

COPY etc/nginx /etc/nginx/
COPY etc/nginx/main.conf /usr/local/openresty/nginx/conf/custom.conf

COPY backend /var/www/foxcaves/lua
COPY --from=frontend_builder /opt/stage/build /var/www/foxcaves/html

ARG GIT_REVISION=UNKNOWN
RUN echo $GIT_REVISION > /var/www/foxcaves/.revision

VOLUME /var/www/foxcaves/storage
VOLUME /var/www/foxcaves/config
