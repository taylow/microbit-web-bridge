const webpack = require('webpack');
var path = require('path');

const HtmlWebpackPlugin = require('html-webpack-plugin');
var MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CopyPlugin = require('copy-webpack-plugin');

var appConfig;
const setupConfig = () => {
  switch (process.env.NODE_ENV) {
    case 'production':
      appConfig = {
        apiHost: "https://energyinschools.co.uk/api/v1",
        translationsFile: "./translations/translations_prod.json"
      }
      break;
    case "staging":
      appConfig = {
        apiHost: "https://staging.energyinschools.co.uk/api/v1",
        translationsFile: "./translations/translations_staging.json"
      }
      break;
    default:
      appConfig = {
        apiHost: "http://127.0.0.1:4000/api/v1",
        translationsFile: "./translations/translations_local.json"
      }
  }
}
setupConfig()

var config = {
    mode: 'production',
    entry: './src/WebBridge.ts',
    output: {
      path: path.resolve(__dirname, 'dist'),
      publicPath: '',
      filename: 'javascripts/WebBridge.bundle.js'
    },
    resolve: {
      extensions: [ '.tsx', '.ts', '.js' ]
    },
    module: {
        rules: [
          // all files with a `.ts` or `.tsx` extension will be handled by `ts-loader`
          { test: /\.tsx?$/, use: "ts-loader", exclude: ['/node_modules/', '/tests']},
          { test: /\.css$/, use: [MiniCssExtractPlugin.loader, 'css-loader'] },
          { test: /\.pug$/, loader: 'pug-loader' },
          { test: /\.(png|jpg)$/, loader: 'url-loader'},
          { test: /\.json$/, loader: 'json-loader'}
        ]
    },
    devServer: {
      contentBase: path.join(__dirname, 'dist'),
      port: 8080,
    },
    plugins: [
        new HtmlWebpackPlugin({
          filename: 'index.html',
          favicon: './images/favicon.ico',
          template: './templates/index.pug',
        }),
        new MiniCssExtractPlugin({ 
          filename: 'stylesheets/styles.css' 
        }),
        new webpack.DefinePlugin({
          API_ENDPOINT: JSON.stringify(appConfig.apiHost)
        })
    ]
}

module.exports = (env, argv) => {
    config.plugins.push(
        new CopyPlugin([
            {from: './images/*.png', to: './'}, // XXX TODO not only png
            {from: './libs/sidebars.js', to: 'javascripts'},
            {from: appConfig.translationsFile, to: 'translations.json'},
        ]),
    )

    if (argv.mode === 'development') {
        config.devtool = "inline-source-map";
    }
    return config;
};