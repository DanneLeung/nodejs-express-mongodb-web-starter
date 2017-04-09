/**
 * Created by danne on 2016/3/30.
 * 微信回复信息配置
 */
/**
 * Created by ZhangXiao on 2015/6/11.
 * 回复信息log
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var ObjectId = Schema.ObjectId;

var WechatReplyLogsSchema = new Schema({
  id: ObjectId
  , originalId: {type: String, required: true, default: ""}   // 原始ID
  , openid: {type: String, required: true, default: ""}   // 粉丝openid
  , xml: {type: String} //文本内容  type=text时必填
}, {timestamps: {}});
//db.branches.ensureIndex({"coordinate":"2d"},{"background":"true"})

WechatReplyLogsSchema.methods = {};

var WechatReplyLogs = mongoose.model('WechatReplyLogs', WechatReplyLogsSchema, 'wechatReplyLogs');
