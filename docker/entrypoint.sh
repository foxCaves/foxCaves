#!/bin/bash
set -euo pipefail

export CAPTCHA_FONT=/usr/share/fonts/opensans/OpenSans-Regular.ttf

# Basic directory structure
mkdir -p "${FCV_STORAGE_ROOT}/storage"
chown foxcaves:foxcaves "${FCV_STORAGE_ROOT}/storage"

# SSL setup
mkdir -p "${FCV_STORAGE_ROOT}/acme/storage"

openssl req -x509 -newkey rsa:2048 -keyout "${FCV_STORAGE_ROOT}/acme/snakeoil.key" -out "${FCV_STORAGE_ROOT}/acme/snakeoil.crt" -sha256 -days 3650 -nodes -subj '/CN=snakeoil' >/dev/null 2>/dev/null
if [ ! -f "${FCV_STORAGE_ROOT}/acme/account.key" ]; then
    openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:4096 -out "${FCV_STORAGE_ROOT}/acme/account.key" >/dev/null 2>/dev/null
fi

chown root:foxcaves "${FCV_STORAGE_ROOT}/acme/account.key"
chmod 640 "${FCV_STORAGE_ROOT}/acme/account.key"

chown -R foxcaves:foxcaves "${FCV_STORAGE_ROOT}/acme/storage"
chmod 700 "${FCV_STORAGE_ROOT}/acme/storage"
# END SSL setup

export FCV_NGINX_ROOT="$(mktemp -d)"
cp -r /etc/nginx/* "${FCV_NGINX_ROOT}"
luajit /usr/share/foxcaves/lua/nginx_configure.lua

export FCV_NGINX_SOCKET="$(mktemp -u)"
rm -f "${FCV_NGINX_SOCKET}"

exec /usr/local/openresty/bin/openresty -p "${FCV_NGINX_ROOT}" -c "${FCV_NGINX_ROOT}/nginx.conf" -g "user foxcaves;" -e stderr
