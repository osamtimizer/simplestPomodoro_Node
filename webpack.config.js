const path = require('path');
const UglifyJSPlugin = require('uglifyjs-webpack-plugin');

//TODO:this file should be adjusted for production environment
const webpack = require('webpack');
module.exports = {
  target: 'web',
  entry: {
    index: './public/javascripts/index.js',
    home: './public/javascripts/home.js',
    eula: './public/javascripts/eula.js',
    signup: './public/javascripts/signup.js',
    header: './public/javascripts/header.js',
    footer: './public/javascripts/footer.js',
    activity: './public/javascripts/activity.js',
    settings: './public/javascripts/settings.js',
    task_management: './public/javascripts/task_management.js',
    confirmDialog: './public/javascripts/confirmDialog.js',
    login: './public/javascripts/login.js'
  },
  output: {
    filename: '[name].js',
    path: path.join(__dirname, '/public/javascripts/build')
  },
  resolve: {
    alias: {
      $: './public/dist/js/vendor/jquery.min.js'
    }
  },
  optimization: {
    minimizer: [
      new UglifyJSPlugin({
        uglifyOptions: {
          compress: {
            drop_console: true,
          }
        }
      })
    ]
  }
}
