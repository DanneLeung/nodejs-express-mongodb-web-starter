"use strict";

module.exports = function (ROOT_PATH) {
  var config = {
    server: {
      port: process.env.PORT || 4000,
      hostname: process.env.HOSTNAME || '127.0.0.1'
    },
    database: {
      user: 'bbs',
      password: 'bbs',
      host: 'localhost',
      port: '27017',
      db: 'bbs',
      url: ''
    },
    redis: {
      mode: "single",
      single: {
        host: 'localhost',
        port: 6379, // Redis port,
        password: 'dan7844'
      },
      cluster: [
        { host: '10.25.63.211', port: 30001 },
        { host: '10.25.63.211', port: 30002 }
      ],
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
      //系统模板配置
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
      retries: 3,
      width: 1280,
      height: 800,
      maxRenders: 50
    }
  };

  config.database.url = process.env.MONGOHQ_URL ||
    'mongodb://' + config.database.user + ':' + config.database.password + '@' + config.database.host + '/' + config.database.db;
  return config;
};