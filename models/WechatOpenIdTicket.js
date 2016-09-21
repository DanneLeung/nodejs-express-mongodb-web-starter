/**
 * Created by ZhangXiao on 2015/6/11.
 * 微信二维码分享数据log
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var ObjectId = Schema.ObjectId;

var WechatOpenIdTicketSchema = new Schema({
  id: ObjectId
  , openid: {type: String, default: ""}   // 粉丝openid
  , ticket: {type: String} //二维码ticket
  , qrcode: {type: ObjectId, ref: "QrCode"} //活动的临时二维码的ID
}, {timestamps: {}});
//db.branches.ensureIndex({"coordinate":"2d"},{"background":"true"})

WechatOpenIdTicketSchema.methods = {};

var WechatOpenIdTicketSchema = mongoose.model('WechatOpenIdTicket', WechatOpenIdTicketSchema, 'WechatOpenIdTickets');
