const path = require('path');

//TODO:this file should be adjusted for production environment
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
  }
}
