import type { Application } from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';

/*
 * DO NOT CHANGE THIS FILE TO .TS
 * webpack-dev-server / create-react-app do not support .ts files currently
 */

const foxCavesURL = 'https://foxcav.es';

// eslint-disable-next-line unicorn/prefer-module
module.exports = function main(app: Application) {
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
