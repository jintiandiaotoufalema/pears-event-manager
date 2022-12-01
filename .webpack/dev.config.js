// import {Configuration} from 'webpack';
const HtmlWebpackPlugin = require('html-webpack-plugin');

/**
 * @type {Configuration}
 */
const config = {
    mode: 'development',
    entry: './index.js',
    module: {
        rules: [
            {
                test: /\.css$/,
                use: [ 'style-loader', 'css-loader' ]
            },
            {
                test: /\.html$/,
                use: [{
                    loader: 'html-loader',
                }]
            },
        ]
    },
    // plugins: [
    //     new HtmlWebpackPlugin({template: './src/index.html'})
    // ],
    output: {
        filename: 'bundle.js',
    },
    devtool: "eval-source-map"
};

module.exports = config;