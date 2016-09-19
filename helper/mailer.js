var _ = require('lodash');
var path = require('path');
var config = require('../config/config');
var templatesDir = path.resolve(config.root + '/mailer');
var nodemailer = require('nodemailer');
var emailTemplates = require('email-templates');

exports.sendOne = function (temp, subject, obj, fn) {

  // 开启一个 SMTP 连接池
  var transport = nodemailer.createTransport("SMTP", {
    host: config.mail.host, // 主机
    secureConnection: config.mail.secure, // 使用 SSL
    port: config.mail.port, // SMTP 端口
    auth: {
      user: config.mail.user,
      pass: config.mail.password
    }
  });
  emailTemplates(templatesDir, function (err, template) {
    if (err) {
      console.log(err)
    } else {

      var locals = obj;

      template(temp, locals, function (err, html, text) {
        if (err) {
          console.log(err)
        } else {

          transport.sendMail({
            from: config.mail.from,
            to: locals.email,
            subject: subject,
            html: html,
            // generateTextFromHTML: true,
            text: text
          }, function (err, responseStatus) {
            if (err) {
              console.log(err)
            } else {
              return fn(null, responseStatus.message, html, text)
            }
          });
        }
      });
    }
  })
};
