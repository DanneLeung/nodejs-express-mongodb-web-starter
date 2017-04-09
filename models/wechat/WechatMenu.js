/**
 * 微信access token
 */
var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

var WechatMenuSchema = new Schema({
  appid: { type: String, default: "" },
  accessToken: { type: String, default: "" },
  expireTime: { type: Date }
});
var WechatMenu = mongoose.model('WechatMenu', WechatMenuSchema, 'wechatmenus')
module.exports = WechatMenu;
