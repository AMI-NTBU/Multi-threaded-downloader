var path = require('path');
var webpack = require('webpack');

module.exports = {
    entry: './entry.js',
    output: {
        path: __dirname,
        filename: 'bundle.js',
        pathinfo: true
    },
    debug: true,
    module: {
        loaders: [
            {
                loader: 'babel-loader',
                test: __dirname,
                query: {
                  presets: 'es2015',
                },
            },
            { test: /\.json$/, loader: "json-loader" }
        ],
        noParse: /node_modules\/json-schema\/lib\/validate\.js/
    },
    plugins: [
        // Avoid publishing files when compilation fails
        new webpack.NoErrorsPlugin()
    ],
    stats: {
        // Nice colored output
        colors: true
    },
    // Create Sourcemaps for the bundle
    devtool: 'source-map',
    node: {
      fs: 'empty',
      net: 'empty',
      tls: 'empty'
    },
};
