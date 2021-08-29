const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function (app) {
    app.use(createProxyMiddleware('/api/v1/ws', {
        target: 'https://foxcav.es',
        ws: true,
        changeOrigin: true,
    }));
    app.use(createProxyMiddleware('/api', {
        target: 'https://foxcav.es',
        changeOrigin: true,
    }));
};
