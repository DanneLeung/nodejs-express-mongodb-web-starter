/**
 * Created by danne on 2016/3/30.
 * 微信回复信息配置
 */
/**
 * Created by ZhangXiao on 2015/6/11.
 * 微信二维码分享数据log
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var ObjectId = Schema.ObjectId;

var WechatShareLogsSchema = new Schema({
  id: ObjectId
  , originalId: {type: String, required: true, default: ""}   // 原始ID
  , openid: {type: String, required: true, default: ""}   // 粉丝openid
  , xml: {type: String} //文本内容
  , type: {type: String} //类型 1:新用户扫码 2:老用户扫码
  , eventKey: {type: String} //二维码参数
  , ticket: {type: String} //二维码ticket
  , wechat: {type: ObjectId, ref: "WechatFans"} //粉丝
  , qrCode: {type: ObjectId, ref: "QrCode"} //二维码
  , flag: {type: String} //1:活动二维码(qrCode != null)  2:非互动二维码(用户分享或其他)
}, {timestamps: {}});
//db.branches.ensureIndex({"coordinate":"2d"},{"background":"true"})
WechatShareLogsSchema.methods = {};

var WechatShareLogs = mongoose.model('WechatShareLogs', WechatShareLogsSchema, 'wechatShareLogs');
