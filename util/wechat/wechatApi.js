/**
 * Created by ZhangXiao on 2016/4/15.
 */
var mongoose = require('mongoose'),
  WechatToken = mongoose.model('WechatToken'),
  WechatJsTicket = mongoose.model('WechatJsTicket');
var WechatAPI = require('wechat-api');

/**
 * 创建wechat-api对象
 * @param appid
 * @param appsecret
 */
module.exports = function (appid, appsecret) {
  var api = new WechatAPI(appid, appsecret, WechatToken.readToken, WechatToken.saveToken);
  api.registerTicketHandle(WechatJsTicket.getTicketToken, WechatJsTicket.saveTicketToken);
  return api;
};