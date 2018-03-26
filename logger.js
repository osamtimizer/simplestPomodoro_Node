const config = require('config');
const log4js = require('log4js');
log4js.configure(config.log4js.configure);

module.exports = {
  system: log4js.getLogger('system'),
  access: log4js.getLogger('access'),
  error: log4js.getLogger('error')
}

