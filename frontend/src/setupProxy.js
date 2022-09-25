const { createProxyMiddleware } = require('http-proxy-middleware');

// DO NOT CHANGE THIS FILE TO .TS
// webpack-dev-server / create-react-app do not support .ts files currently

module.exports = function (app) {
    app.use(
        createProxyMiddleware('/api/v1/ws', {
            target: 'https://caves.fox.ax',
            ws: true,
            changeOrigin: true,
        }),
    );
    app.use(
        createProxyMiddleware('/api', {
            target: 'https://caves.fox.ax',
            changeOrigin: true,
        }),
    );
};
