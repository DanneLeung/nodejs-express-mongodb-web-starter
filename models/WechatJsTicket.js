/**
 * 微信JSAPI Ticket数据模型
 */
var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

var WechatJsTicketSchema = new Schema({
  appid: {type: String, index: true, default: ""},
  type: {type: String, default: ""},
  ticket: {type: String, default: ""},
  expireTime: {type: Date}
})

WechatJsTicketSchema.statics.getTicketToken = function (type, callback) {
  var appid = this.appid;
  console.log("************ getTicketToken with appid: " + appid);
  WechatJsTicket.findOne({
    appid: appid,
    type: type
  }, function (err, token) {
    console.log("************ getTicketToken token found: " + token);
    if (err) return callback(err);
    callback(null, token);
  });
};

/**
 * token存储到db中
 * @param token
 * @param callback
 */
WechatJsTicketSchema.statics.saveTicketToken = function (type, token, callback) {
  //var sample = {
  //  "accessToken": "VxuSHAViLLP0S0N_EHjWRJukLkTMBzBmVhs_oFwjNJtlVZHWE_bet3u-dGDZd-nmjgFcHleFuZ3c2QpTc6OQ4-TX3c0v6lgzEeGF--7xw6Cpq-tyaCC-kCXM0qqXG92YCOKgABAHTP",
  //  "expireTime": 1462884184251
  //};
  // var appid = this.appid;
  var appid = this.appid;
  console.log("********** saveTicketToken with appid: " + appid);
  console.log('********** saveTicketToken saved token: + ' + JSON.stringify(token));
  WechatJsTicket.findOne({
    appid: appid,
    type: type
  }, function (err, tk) {
    if (err || !tk) {
      var wt = new WechatJsTicket(token);
      wt.type = type;
      wt.appid = appid;
      wt.save(function (err, t) {
        callback(err);
      });
    } else {
      WechatJsTicket.findOneAndUpdate({
        appid: appid,
        type: type
      }, token, {
        new: true
      }, function (err, t) {
        callback(err);
      });
    }
  });
}
var WechatJsTicket = mongoose.model('WechatJsTicket', WechatJsTicketSchema, 'wechatjstickets')
module.exports = WechatJsTicket;
