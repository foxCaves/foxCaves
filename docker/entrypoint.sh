#!/bin/bash
set -euo pipefail

export CAPTCHA_FONT=/usr/share/fonts/opensans/OpenSans-Regular.ttf

# Basic directory structure
mkdir -p /var/lib/foxcaves/storage
chown foxcaves:foxcaves /var/lib/foxcaves/storage

# SSL setup
mkdir -p /var/lib/foxcaves/acme

openssl req -x509 -newkey rsa:2048 -keyout /var/lib/foxcaves/acme/snakeoil.key -out /var/lib/foxcaves/acme/snakeoil.crt -sha256 -days 3650 -nodes -subj '/CN=snakeoil' >/dev/null 2>/dev/null
if [ ! -f /var/lib/foxcaves/acme/account.key ]; then
    openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:4096 -out /var/lib/foxcaves/acme/account.key >/dev/null 2>/dev/null
fi

chown root:foxcaves /var/lib/foxcaves/acme/account.key
chmod 640 /var/lib/foxcaves/acme/account.key

chown -R foxcaves:foxcaves /var/lib/foxcaves/acme/storage
chmod 700 /var/lib/foxcaves/acme/storage
# END SSL setup

export FCV_NGINX_ROOT="$(mktemp -d)"
cp -r /etc/nginx/* "${FCV_NGINX_ROOT}"
luajit /usr/share/foxcaves/lua/nginx_configure.lua

rm -f /run/foxcaves-nginx-api.sock

exec /usr/local/openresty/bin/openresty -p "${FCV_NGINX_ROOT}" -c "${FCV_NGINX_ROOT}/nginx.conf" -g "user foxcaves;" -e stderr
