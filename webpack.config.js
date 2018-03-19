const path = require('path');

module.exports = {
  target: 'web',
  entry: {
    index: './public/javascripts/index.js',
    users: './public/javascripts/users.js',
    login: './public/javascripts/login.js'
  },
  output: {
    filename: '[name].js',
    path: path.join(__dirname, '/public/javascripts/build')
  }
}
