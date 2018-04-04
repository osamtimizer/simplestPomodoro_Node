const path = require('path');

const webpack = require('webpack');
module.exports = {
  target: 'web',
  entry: {
    index: './public/javascripts/index.js',
    users: './public/javascripts/users.js',
    home: './public/javascripts/home.js',
    pomodoro: './public/javascripts/pomodoro.js',
    register: './public/javascripts/register.js',
    activity: './public/javascripts/activity.js',
    settings: './public/javascripts/settings.js',
    login: './public/javascripts/login.js'
  },
  output: {
    filename: '[name].js',
    path: path.join(__dirname, '/public/javascripts/build')
  },
  plugins: [
    new webpack.ProvidePlugin({
      $: 'jquery',
      jQuery: 'jquery'
    })
  ]
}
