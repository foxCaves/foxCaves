#!/bin/sh
set -e

export CAPTCHA_FONT=/usr/share/fonts/opensans/OpenSans-Regular.ttf

# Basic directory structure
mkdir -p /var/www/foxcaves/tmp /var/www/foxcaves/storage
chown foxcaves:foxcaves /var/www/foxcaves/tmp /var/www/foxcaves/storage

# SSL setup
mkdir -p /etc/letsencrypt/storage

openssl req -x509 -newkey rsa:2048 -keyout /etc/letsencrypt/snakeoil.key -out /etc/letsencrypt/snakeoil.crt -sha256 -days 3650 -nodes -subj '/CN=snakeoil' >/dev/null
if [ ! -f /etc/letsencrypt/account.key ]; then
    openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:4096 -out /etc/letsencrypt/account.key >/dev/null
fi

chown root:root /etc/letsencrypt

chown root:foxcaves /etc/letsencrypt/account.key
chmod 640 /etc/letsencrypt/account.key

chown -R foxcaves:foxcaves /etc/letsencrypt/storage
chmod 700 /etc/letsencrypt/storage
# END SSL setup

luajit /var/www/foxcaves/lua/nginx_configure.lua

rm -f /run/nginx-lua-api.sock

exec /usr/local/openresty/bin/openresty -c /usr/local/openresty/nginx/conf/custom.conf
