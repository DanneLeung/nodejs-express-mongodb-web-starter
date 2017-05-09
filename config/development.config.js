"use strict";

module.exports = function (ROOT_PATH) {
  var config = {
    server: {
      port: process.env.PORT || 3000,
      hostname: process.env.HOSTNAME || '127.0.0.1'
    },
    database: {
      user: 'starter',
      password: 'starter',
      host: 'xcesys.com',
      port: '27017',
      db: 'starter',
      url: ''
    },
    redis: {
      mode: "single",
      single: {
        port: 6379, // Redis port
        host: '127.0.0.1',
        // password: 'dan7844'
      },
      cluster: [],
      options: {
        maxRedirections: 16,
        retryDelayOnFailover: 1000
      }
    },
    root: ROOT_PATH,
    app: {
      name: 'ExtrasAdmin'
    },
    template: {
      path: '/public/themes/'
    },
    file: {
      local: 'public',
      url: '',
      qiniu: {}
    },
    imgZip: true,
    mail: {
      host: 'smtp.163.com',
      port: '995',
      secure: true,
      user: process.env.MAIL_USER || 'lshefan@163.com',
      password: process.env.MAIL_PASSWORD || 'notset',
      from: 'DanneLeung<lshefan@163.com>'
    },
    phamtom: {
      retries: 2,
      width: 1280,
      height: 800,
      maxRenders: 50
    }
  };
  config.database.url = process.env.MONGOHQ_URL ||
    'mongodb://' + (config.database.user ? config.database.user + ':' + config.database.password + '@' : '') + config.database.host + '/' + config.database.db;
  return config;
};
