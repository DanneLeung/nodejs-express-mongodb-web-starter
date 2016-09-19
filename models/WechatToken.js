/**
 * 微信access token
 */
var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

var WechatTokenSchema = new Schema({
  appid: {type: String, unique: true, index: true, default: ""},
  accessToken: {type: String, default: ""},
  expireTime: {type: Number}
}, {timestamps: {}});

WechatTokenSchema.methods = {}
/**
 * 从db中读取token
 * @param callback
 */
WechatTokenSchema.statics.readToken = function (callback) {
  var appid = this.appid;
  //console.log("************ readToken with appid: " + appid);
  WechatToken.findOne({
    appid: appid
  }, function (err, token) {
    //console.log("************ readToken token found: " + token);
    if (err) return callback(err);
    callback(null, token);
  });
};

/**
 * token存储到db中
 * @param token
 * @param callback
 */
WechatTokenSchema.statics.saveToken = function (token, callback) {
  //var sample = {
  //  "accessToken": "VxuSHAViLLP0S0N_EHjWRJukLkTMBzBmVhs_oFwjNJtlVZHWE_bet3u-dGDZd-nmjgFcHleFuZ3c2QpTc6OQ4-TX3c0v6lgzEeGF--7xw6Cpq-tyaCC-kCXM0qqXG92YCOKgABAHTP",
  //  "expireTime": 1462884184251
  //};
  var appid = this.appid;
  //console.log("********** saveToken with appid: " + appid);
  //console.log('********** be saved token: + ' + JSON.stringify(token));
  WechatToken.findOne({
    appid: appid
  }, function (err, tk) {
    if (err || !tk) {
      var wt = new WechatToken({
        appid: appid,
        accessToken: token.accessToken,
        expireTime: token.expireTime
      });
      wt.save(function (err, t) {
        callback(err);
      });
    } else {
      WechatToken.findOneAndUpdate({
        appid: appid
      }, {
        accessToken: token.accessToken,
        expireTime: token.expireTime
      }, {
        new: true
      }, function (err, t) {
        callback(err);
      });
    }
  });
}
var WechatToken = mongoose.model('WechatToken', WechatTokenSchema, 'wechattokens')
module.exports = WechatToken;
