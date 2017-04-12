/**
 * Module dependencies.
 *  微信页面访问统计
 */
var mongoose = require('mongoose'),
  Schema = mongoose.Schema,
  ObjectId = Schema.ObjectId;
var moment = require('moment')

/**
 * User Schema
 */
var WechatMenuShareSchema = new Schema({
  wechat: {type: ObjectId, index: true, ref: 'Wechat'}, //渠道下的公众号
  wechatFans: {type: ObjectId, ref: 'WechatFans'}, //粉丝
  link: {type: String, trim: true, default: ''}, //分享链接
  desc: {type: String, trim: true, default: ''},//分享界面描述
  openid: {type: String}, // 粉丝openid
  nickname: {type: String}, //粉丝昵称
  shareDate: {type: String, default: ''}, //分享日期 YYYY-MM-DD
  shareTime: {type: String, default: ''}, //分享时间 YYYY-MM- HH:MI:SS
  type: {type: String, trim: true, default: '2'}, //分享类型 1:分享好友 2:分享朋友圈
}, {timestamps: {}})

/**
 * 保存分享朋友圈信息
 */
WechatMenuShareSchema.statics.saveMenuShareTimeline = function (obj, cb) {
  if(!cb){
    cb = function(){}
  }

  WechatMenuShare.findOne({
    wechatFans: obj.wechatFans,
    link: obj.link,
    shareDate: obj.shareDate,
    type: '2'
  }, function (err, fans) {
    if(fans){
      //同一粉丝，同一链接，朋友圈的记录只记录一次
      cb(null, null);
    }else{
      new WechatMenuShare(obj).save((err, obj)=>{
        cb(err, obj);
      })
    }
  });
};

var WechatMenuShare = mongoose.model('WechatMenuShare', WechatMenuShareSchema);
