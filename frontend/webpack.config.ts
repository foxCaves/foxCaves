import path from 'node:path';
import ContentReplacePlugin from 'content-replace-webpack-plugin';
import CopyPlugin from 'copy-webpack-plugin';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import { Configuration, DefinePlugin } from 'webpack';
import 'webpack-dev-server';

// eslint-disable-next-line unicorn/prefer-module
const PWD = __dirname;

type NodeEnv = 'development' | 'production' | undefined;

// eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
const mode: NodeEnv = (process.env.NODE_ENV as NodeEnv) ?? 'development';

const config: Configuration = {
    mode,
    entry: './src/index.tsx',
    output: {
        path: path.join(PWD, 'build'),
        publicPath: '/static/',
        filename: '[name].[contenthash].js',
        chunkFilename: '[id].[contenthash].js',
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
                use: [MiniCssExtractPlugin.loader, 'css-loader'],
            },
            {
                test: /\.(png|svg|jpg|jpeg|gif)$/i,
                type: 'asset/resource',
            },
        ],
    },
    plugins: [
        new DefinePlugin({
            GIT_REVISION: JSON.stringify(process.env.GIT_REVISION),
        }),
        new CopyPlugin({
            patterns: [
                {
                    from: 'public',
                },
            ],
        }),
        new HtmlWebpackPlugin({
            template: 'src/index.html',
        }),
        new MiniCssExtractPlugin({
            filename: '[name].[contenthash].css',
            chunkFilename: '[id].[contenthash].css',
        }),
        new ContentReplacePlugin({
            rules: {
                '*.css': (content: string) => {
                    return content.replaceAll(
                        'https://fonts.googleapis.com/css2?family=Lato:wght@400;700&display=swap',
                        // eslint-disable-next-line @cspell/spellchecker
                        '/static/fonts/lato.css',
                    );
                },
            },
        }),
    ],
    devServer: {
        historyApiFallback: {
            index: `/static/index.html`,
        },
        static: {
            directory: path.join(PWD, 'public'),
        },
        proxy: [
            {
                path: '/api',
                target: 'https://foxcav.es:443',
                changeOrigin: true,
                headers: {
                    Host: 'foxcav.es',
                },
            },
            {
                path: '/api/v1/ws',
                target: 'wss://foxcav.es:443',
                changeOrigin: true,
                ws: true,
                headers: {
                    Host: 'foxcav.es',
                },
            },
        ],
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js'],
    },
};

// eslint-disable-next-line import/no-unused-modules, import/no-default-export
export default config;
