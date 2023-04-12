import { join } from 'node:path';
// eslint-disable-next-line import/default
import CopyPlugin from 'copy-webpack-plugin';
import { Configuration } from 'webpack';
import 'webpack-dev-server';

// eslint-disable-next-line unicorn/prefer-module
const PWD = __dirname;

type NodeEnv = 'development' | 'production' | undefined;

const config: Configuration = {
    mode: (process.env.NODE_ENV as NodeEnv) ?? 'development',
    entry: './src/index.tsx',
    output: {
        path: join(PWD, 'build'),
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
        new CopyPlugin({
            patterns: [{ from: 'public' }],
        }),
    ],
    devServer: {
        static: {
            directory: join(PWD, 'public'),
        },
        proxy: {
            '/api': {
                target: 'https://foxcav.es:443',
                changeOrigin: true,
                headers: {
                    Host: 'foxcav.es',
                },
            },
            '/api/v1/ws': {
                target: 'wss://foxcav.es:443',
                changeOrigin: true,
                ws: true,
                headers: {
                    Host: 'foxcav.es',
                },
            },
        },
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js'],
    },
};

// eslint-disable-next-line import/no-unused-modules, import/no-default-export
export default config;
