'use strict';
const webpack = require('webpack'); 
const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
    mode: 'development',
    entry: './src/index.tsx',
    output: {
        path: path.join(__dirname, '/build'),
        publicPath: '/static/',
    },
    module: {
      rules: [
        {
            test: /\.tsx?$/,
            use: 'ts-loader',
            exclude: /node_modules/,
        },
        {
            test: /\.css$/i,
            use: ['style-loader', 'css-loader'],
        },
        {
           test: /\.(png|svg|jpg|jpeg|gif)$/i,
           type: 'asset/resource',
        },
      ],
    },
    plugins: [
        new webpack.DefinePlugin({
            'REACT_APP_SENTRY_DSN': JSON.stringify(process.env.REACT_APP_SENTRY_DSN),
        }),
        new CopyWebpackPlugin({
            patterns: [
                { from: 'public' }
            ],
        }),
    ],
    devServer: {
        static: {
            directory: path.join(__dirname, 'public'),
          },
        proxy: {
            '/api': {
                target: 'https://foxcav.es:443',
                changeOrigin: true,
                headers: {
                    'Host': 'foxcav.es',
                },
            },
            '/api/v1/ws': {
                target: 'wss://foxcav.es:443',
                changeOrigin: true,
                ws: true,
                headers: {
                    'Host': 'foxcav.es',
                },
            },
        },
    },
    resolve: {
      extensions: ['.tsx', '.ts', '.js'],
    },
};
