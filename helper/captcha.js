/**
 * Created by danne on 16/4/8.
 */
'use strict';
var captcha = require("captchapng");

exports.getCaptcha = function (req, res) {
  var type = req.params.type || req.query.type;
  if (!type || typeof type === 'undefined') {
    type = '';
  }
  type += 'captchaCode';
  console.log("########## captcha type ", type);
  var imgbase64 = generateCaptcha(req, type);
  res.set('Content-Type', 'image/png');
  console.log("*********** 生成验证码%s,SessionID:%s ", req.session[type], req.session.id);
  res.send(imgbase64);
};

/**
 */
function generateCaptcha(req, type) {
  var code = parseInt(Math.random() * 9000 + 1000);
  var p = new captcha(80, 34, code); // width,height,numeric captcha
  p.color(0, 0, 0, 0); // First color: background (red, green, blue, alpha)
  p.color(80, 80, 80, 255); // Second color: paint (red, green, blue, alpha)
  var img = p.getBase64();
  var imgbase64 = new Buffer(img, 'base64');
  req.session[type] = '' + code; // 保存到session中
  return imgbase64;
}

exports.validate = function (req, type) {
  if (!type || type === undefined) {
    type = '';
  }
  type = type + 'captchaCode';

  let b = (req.session[type] === req.body.captcha);
  if (!b)
    console.log("###### 输入的验证码(%s!=%s)不正确,SessionID: %s", req.body.captcha, req.session[type], req.session.id);
  //delete req.session.captchaCode;
  return b;
}
