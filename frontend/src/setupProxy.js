/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable unicorn/prefer-module */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-require-imports */
// eslint-disable-next-line no-undef
const { createProxyMiddleware } = require('http-proxy-middleware');

/*
 * DO NOT CHANGE THIS FILE TO .TS
 * webpack-dev-server / create-react-app do not support .ts files currently
 */

const foxCavesURL = 'https://foxcav.es';

// eslint-disable-next-line no-undef
module.exports = function siteProxy(app) {
    app.use(
        createProxyMiddleware('/api/v1/ws', {
            target: foxCavesURL,
            ws: true,
            changeOrigin: true,
        }),
    );

    app.use(
        createProxyMiddleware('/api', {
            target: foxCavesURL,
            changeOrigin: true,
        }),
    );
};
