const path = require('path');

module.exports = {
  target: 'web',
  entry: {
    index: './public/javascripts/index.js',
    users: './public/javascripts/users.js',
    pomodoro: './public/javascripts/pomodoro.js',
    register: './public/javascripts/register.js',
    activity: './public/javascripts/activity.js',
    login: './public/javascripts/login.js'
  },
  output: {
    filename: '[name].js',
    path: path.join(__dirname, '/public/javascripts/build')
  }
}
